import { mockDb, MockTask, TaskArea, TaskPriority } from "../../services/mockDb.js";

export interface EnsureSystemTaskParams {
  clientId?: string | null;
  sourceRef: string;
  title: string;
  area: TaskArea;
  priority: TaskPriority;
  link?: string | null;
  descriptionMarkdown?: string;
}

/**
 * Cria ou garante uma tarefa gerada pelo sistema (spec 10.1).
 * Regras:
 * - Se já existe tarefa aberta (status != DONE) com o mesmo sourceRef, não cria outra.
 * - Cria com source = 'SYSTEM', visibility = 'INTERNAL', kind = 'PROJECT', sem responsável, prazo hoje.
 * - link é guardado na tarefa e vira no detalhe o botão "Abrir onde resolver".
 */
export function ensureSystemTask(params: EnsureSystemTaskParams): MockTask {
  const { clientId, sourceRef, title, area, priority, link, descriptionMarkdown } = params;
  const today = new Date().toISOString().split("T")[0];

  // Se já existe tarefa aberta com o mesmo sourceRef, retorna ela sem duplicar
  const existingOpen = mockDb.tasks.find(
    (t) => !t.deletedAt && t.sourceRef === sourceRef && t.status !== "DONE"
  );
  if (existingOpen) {
    return existingOpen;
  }

  const newTask: MockTask = {
    id: `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    clientId: clientId || null,
    title,
    descriptionMarkdown: descriptionMarkdown || `Tarefa gerada automaticamente pelo sistema (${sourceRef}).`,
    status: "TODO",
    priority,
    kind: "PROJECT",
    area,
    visibility: "INTERNAL",
    source: "SYSTEM",
    sourceRef,
    assignedUserId: null,
    dueDate: today,
    waitingReason: null,
    link: link || null,
    timeEstimateMinutes: 30,
    timeSpentMinutes: 0,
    seriesId: null,
    recurrence: null,
    seriesEndedAt: null,
    checklists: [],
    attachments: [],
    createdByUserId: "usr_system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    deletedAt: null,
  };

  mockDb.taskHistory = mockDb.taskHistory || [];
  mockDb.taskHistory.push({
    id: `his_${Date.now()}_sys`,
    taskId: newTask.id,
    type: "CREATED",
    authorName: "Sistema",
    createdAt: new Date().toISOString(),
  });

  mockDb.tasks.push(newTask);
  return newTask;
}

/**
 * Move a tarefa do sistema com sourceRef para DONE (spec 10.1).
 * Registra no histórico "Concluída automaticamente".
 */
export function resolveSystemTask(sourceRef: string): MockTask | null {
  const task = mockDb.tasks.find(
    (t) => !t.deletedAt && t.sourceRef === sourceRef && t.status !== "DONE"
  );
  if (!task) {
    return null;
  }

  task.status = "DONE";
  task.completedAt = new Date().toISOString();
  task.updatedAt = new Date().toISOString();

  mockDb.taskHistory = mockDb.taskHistory || [];
  mockDb.taskHistory.push({
    id: `his_${Date.now()}_res`,
    taskId: task.id,
    type: "STATUS_CHANGED",
    from: "TODO",
    to: "DONE",
    authorName: "Concluída automaticamente",
    createdAt: new Date().toISOString(),
  });

  return task;
}
