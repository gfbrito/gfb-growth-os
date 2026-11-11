import { Request, Response } from "express";
import { mockDb, MockTask, TaskStatus, TaskPriority, TaskKind, TaskArea, TaskVisibility, TaskRecurrence } from "../../services/mockDb.js";
import { handleTaskCompletionRecurrence, validateCanReopen } from "./recurrence.service.js";

/**
 * Helper to compute derived task fields (spec 5.1)
 */
function enrichTask(task: MockTask, today: string, isClientViewer: boolean = false) {
  const client = task.clientId ? mockDb.clients.find((c) => c.id === task.clientId) : null;
  const assignee = task.assignedUserId ? mockDb.users.find((u) => u.id === task.assignedUserId) : null;
  const comments = (mockDb.taskComments || []).filter(
    (c) => c.taskId === task.id && (!isClientViewer || !c.internal)
  );

  return {
    ...task,
    clientName: client ? client.name : "Interna",
    assigneeName: assignee ? assignee.name : "Sem responsável",
    assigneeAvatar: assignee ? assignee.avatarUrl : "",
    isOverdue: Boolean(task.dueDate && task.dueDate < today && task.status !== "DONE"),
    commentCount: comments.length,
  };
}

/**
 * GET /api/tasks
 * Suporta filtros: clientId, status, priority, kind, area, assignedUserId, overdue, q
 * Resposta: { tasks, counts: { open, overdue, awaitingApproval, dueToday } }
 */
export async function listTasks(req: Request, res: Response): Promise<void> {
  const user = req.user as any;
  const today = new Date().toISOString().split("T")[0];

  // RBAC 5.2: Atendente não tem acesso a tarefas
  if (user?.growthRole === "CLIENT_ATTENDANT") {
    res.json({
      tasks: [],
      counts: { open: 0, overdue: 0, awaitingApproval: 0, dueToday: 0 },
    });
    return;
  }

  let { clientId, status, priority, kind, area, assignedUserId, overdue, q, seriesId, source } = req.query;

  // Base de tarefas ativas (não deletadas)
  const nonDeleted = mockDb.tasks.filter((t) => !t.deletedAt);

  // Escopo de acesso conforme papel
  let accessibleTasks: MockTask[] = [];

  if (user?.growthRole === "CLIENT_OWNER") {
    // Cliente só vê tarefas do seu próprio clientId E com visibility = 'CLIENT'
    const clientScopeId = user.clientId || "";
    accessibleTasks = nonDeleted.filter(
      (t) => t.clientId === clientScopeId && t.visibility === "CLIENT"
    );
  } else {
    // Agência vê tudo (incluindo internas com clientId = null e visibility = 'INTERNAL')
    accessibleTasks = nonDeleted;

    // Se a agência filtrou por clientId
    if (clientId) {
      if (clientId === "internal" || clientId === "null") {
        accessibleTasks = accessibleTasks.filter((t) => !t.clientId);
      } else {
        accessibleTasks = accessibleTasks.filter((t) => t.clientId === clientId);
      }
    }
  }

  // Contadores calculados sobre o escopo acessível do usuário
  const counts = {
    open: accessibleTasks.filter((t) => t.status !== "DONE").length,
    overdue: accessibleTasks.filter((t) => Boolean(t.dueDate && t.dueDate < today && t.status !== "DONE")).length,
    awaitingApproval: accessibleTasks.filter((t) => t.status === "AWAITING_APPROVAL").length,
    dueToday: accessibleTasks.filter((t) => t.dueDate === today && t.status !== "DONE").length,
  };

  // Aplicação dos demais filtros na listagem
  let filtered = [...accessibleTasks];

  if (status) {
    filtered = filtered.filter((t) => t.status === status);
  }
  if (priority) {
    filtered = filtered.filter((t) => t.priority === priority);
  }
  if (kind) {
    filtered = filtered.filter((t) => t.kind === kind);
  }
  if (area) {
    filtered = filtered.filter((t) => t.area === area);
  }
  if (assignedUserId) {
    filtered = filtered.filter((t) => t.assignedUserId === assignedUserId);
  }
  if (overdue === "true") {
    filtered = filtered.filter((t) => Boolean(t.dueDate && t.dueDate < today && t.status !== "DONE"));
  }
  if (req.query.dueToday === "true") {
    filtered = filtered.filter((t) => t.dueDate === today && t.status !== "DONE");
  }
  if (q && typeof q === "string") {
    const term = q.toLowerCase().trim();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        (t.descriptionMarkdown && t.descriptionMarkdown.toLowerCase().includes(term))
    );
  }
  if (seriesId) {
    filtered = filtered.filter((t) => t.seriesId === seriesId);
  }
  if (source) {
    filtered = filtered.filter((t) => t.source === source);
  }

  const isClientViewer = user?.growthRole === "CLIENT_OWNER";
  const enriched = filtered.map((t) => enrichTask(t, today, isClientViewer));
  res.json({ tasks: enriched, counts });
}

/**
 * GET /api/tasks/:id
 */
export async function getTaskById(req: Request, res: Response): Promise<void> {
  const user = req.user as any;
  const id = String(req.params.id);
  const today = new Date().toISOString().split("T")[0];

  if (user?.growthRole === "CLIENT_ATTENDANT") {
    res.status(403).json({ error: "Acesso negado às tarefas" });
    return;
  }

  const task = mockDb.tasks.find((t) => t.id === id && !t.deletedAt);
  if (!task) {
    res.status(404).json({ error: "Tarefa não encontrada" });
    return;
  }

  if (user?.growthRole === "CLIENT_OWNER") {
    if (task.clientId !== user.clientId || task.visibility !== "CLIENT") {
      res.status(404).json({ error: "Tarefa não encontrada" });
      return;
    }
  }

  const enriched = enrichTask(task, today);
  let seriesOccurrences: any[] = [];
  if (task.seriesId) {
    seriesOccurrences = mockDb.tasks
      .filter((t) => !t.deletedAt && t.seriesId === task.seriesId && t.id !== task.id)
      .map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        dueDate: t.dueDate,
        completedAt: t.completedAt,
      }))
      .sort((a, b) => (b.completedAt || b.dueDate || "").localeCompare(a.completedAt || a.dueDate || ""));
  }

  res.json({ task: { ...enriched, seriesOccurrences } });
}

/**
 * POST /api/tasks
 * Valida campos de 5.1 e grava createdByUserId
 */
export async function createTask(req: Request, res: Response): Promise<void> {
  const user = req.user as any;
  const today = new Date().toISOString().split("T")[0];

  if (user?.growthRole === "CLIENT_ATTENDANT") {
    res.status(403).json({ error: "Atendentes não podem criar tarefas" });
    return;
  }

  const {
    title,
    descriptionMarkdown,
    status,
    priority,
    dueDate,
    timeEstimateMinutes,
    kind,
    area,
    visibility,
    clientId,
    assignedUserId,
    recurrence,
    checklists,
    attachments,
  } = req.body;

  if (!title || typeof title !== "string" || !title.trim() || title.trim().length > 140) {
    res.status(400).json({ error: "Título é obrigatório e deve ter até 140 caracteres" });
    return;
  }

  const isClientOwner = user?.growthRole === "CLIENT_OWNER";
  const effectiveKind = isClientOwner ? "PROJECT" : ((kind as TaskKind) || "PROJECT");

  let seriesId: string | null = null;
  let taskRecurrence: TaskRecurrence | null = null;

  if (effectiveKind === "RECURRING" && recurrence) {
    seriesId = `ser_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    taskRecurrence = {
      frequency: recurrence.frequency || "WEEKLY",
      weekday: recurrence.weekday !== undefined ? Number(recurrence.weekday) : undefined,
      dayOfMonth: recurrence.dayOfMonth !== undefined ? Number(recurrence.dayOfMonth) : undefined,
      anchorDate: recurrence.anchorDate || (dueDate !== undefined ? dueDate : today),
    };
  }

  const newTask: MockTask = {
    id: `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    descriptionMarkdown: descriptionMarkdown || "",
    status: isClientOwner ? "TODO" : ((status as TaskStatus) || "TODO"),
    priority: (priority as TaskPriority) || "NORMAL",
    kind: effectiveKind,
    area: (area as TaskArea) || "OTHER",
    // Cliente sempre cria com visibility = 'CLIENT' e seu próprio clientId
    visibility: isClientOwner ? "CLIENT" : ((visibility as TaskVisibility) || "INTERNAL"),
    clientId: isClientOwner ? user.clientId : (clientId !== undefined ? clientId : null),
    // Cliente não escolhe responsável
    assignedUserId: isClientOwner ? null : (assignedUserId || null),
    source: "MANUAL",
    sourceRef: null,
    dueDate: dueDate !== undefined ? dueDate : today,
    waitingReason: null,
    timeEstimateMinutes: Number(timeEstimateMinutes) || 0,
    timeSpentMinutes: 0,
    seriesId,
    recurrence: taskRecurrence,
    seriesEndedAt: null,
    checklists: Array.isArray(checklists)
      ? checklists.map((c: any, idx: number) => ({
          id: c.id || `chk_${Date.now()}_${idx}`,
          title: c.title,
          done: Boolean(c.done),
          position: c.position !== undefined ? c.position : idx,
        }))
      : [],
    attachments: Array.isArray(attachments) ? attachments : [],
    createdByUserId: user?.id || "usr_gisley",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    deletedAt: null,
  };

  mockDb.taskHistory = mockDb.taskHistory || [];
  mockDb.taskHistory.push({
    id: `his_${Date.now()}`,
    taskId: newTask.id,
    type: "CREATED",
    authorName: user?.name || "Usuário",
    createdAt: new Date().toISOString(),
  });

  mockDb.tasks.unshift(newTask);
  res.status(201).json({ task: enrichTask(newTask, today) });
}

/**
 * PATCH /api/tasks/:id
 */
export async function updateTask(req: Request, res: Response): Promise<void> {
  const user = req.user as any;
  const id = String(req.params.id);
  const today = new Date().toISOString().split("T")[0];

  if (user?.growthRole === "CLIENT_ATTENDANT") {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  const taskIndex = mockDb.tasks.findIndex((t) => t.id === id && !t.deletedAt);
  if (taskIndex === -1) {
    res.status(404).json({ error: "Tarefa não encontrada" });
    return;
  }

  const currentTask = mockDb.tasks[taskIndex];

  // RBAC 5.2: Cliente não pode editar campos de tarefa diretamente (apenas ações de aprovação)
  if (user?.growthRole === "CLIENT_OWNER") {
    res.status(403).json({ error: "Clientes não têm permissão para editar campos da tarefa" });
    return;
  }

  const {
    title,
    descriptionMarkdown,
    status,
    priority,
    kind,
    area,
    visibility,
    clientId,
    assignedUserId,
    dueDate,
    waitingReason,
    timeEstimateMinutes,
    timeSpentMinutes,
    checklists,
    attachments,
  } = req.body;

  mockDb.taskHistory = mockDb.taskHistory || [];

  if (title !== undefined) {
    if (!title.trim() || title.trim().length > 140) {
      res.status(400).json({ error: "Título deve ter entre 1 e 140 caracteres" });
      return;
    }
    currentTask.title = title.trim();
  }

  if (descriptionMarkdown !== undefined) currentTask.descriptionMarkdown = descriptionMarkdown;
  if (priority !== undefined) currentTask.priority = priority;
  if (kind !== undefined) currentTask.kind = kind;
  if (area !== undefined) currentTask.area = area;
  if (visibility !== undefined) currentTask.visibility = visibility;
  if (clientId !== undefined) currentTask.clientId = clientId;

  if (assignedUserId !== undefined && assignedUserId !== currentTask.assignedUserId) {
    const oldAssignee = currentTask.assignedUserId ? mockDb.users.find((u) => u.id === currentTask.assignedUserId)?.name : "Sem responsável";
    const newAssignee = assignedUserId ? mockDb.users.find((u) => u.id === assignedUserId)?.name : "Sem responsável";
    mockDb.taskHistory.push({
      id: `his_${Date.now()}_as`,
      taskId: currentTask.id,
      type: "ASSIGNEE_CHANGED",
      from: oldAssignee,
      to: newAssignee,
      authorName: user?.name || "Usuário",
      createdAt: new Date().toISOString(),
    });
    currentTask.assignedUserId = assignedUserId;
  }

  if (dueDate !== undefined && dueDate !== currentTask.dueDate) {
    mockDb.taskHistory.push({
      id: `his_${Date.now()}_dd`,
      taskId: currentTask.id,
      type: "DUE_DATE_CHANGED",
      from: currentTask.dueDate,
      to: dueDate,
      authorName: user?.name || "Usuário",
      createdAt: new Date().toISOString(),
    });
    currentTask.dueDate = dueDate;
  }

  if (waitingReason !== undefined) currentTask.waitingReason = waitingReason;
  if (timeEstimateMinutes !== undefined) currentTask.timeEstimateMinutes = Number(timeEstimateMinutes);
  if (timeSpentMinutes !== undefined) currentTask.timeSpentMinutes = Number(timeSpentMinutes);
  if (attachments !== undefined) currentTask.attachments = attachments;

  if (checklists !== undefined && Array.isArray(checklists)) {
    currentTask.checklists = checklists.map((c: any, idx: number) => ({
      id: c.id || `chk_${Date.now()}_${idx}`,
      title: c.title,
      done: Boolean(c.done),
      position: c.position !== undefined ? c.position : idx,
    }));
  }

  if (status !== undefined) {
    if (status === "AWAITING_APPROVAL") {
      const effectiveVis = visibility !== undefined ? visibility : currentTask.visibility;
      if (effectiveVis !== "CLIENT") {
        res.status(400).json({ error: "Tarefas em aprovação precisam ter visibilidade visível ao cliente" });
        return;
      }
    }

    if (status === "WAITING") {
      if (waitingReason !== undefined) currentTask.waitingReason = waitingReason;
    } else {
      currentTask.waitingReason = null;
    }

    if (status !== currentTask.status) {
      // Regra 4: Bloquear reabertura de ocorrência antiga quando a seguinte já existe
      if (currentTask.status === "DONE" && status !== "DONE") {
        const reopenCheck = validateCanReopen(currentTask);
        if (!reopenCheck.canReopen) {
          res.status(400).json({ error: reopenCheck.error });
          return;
        }
      }

      mockDb.taskHistory.push({
        id: `his_${Date.now()}_st`,
        taskId: currentTask.id,
        type: "STATUS_CHANGED",
        from: currentTask.status,
        to: status,
        authorName: user?.name || "Usuário",
        createdAt: new Date().toISOString(),
      });
      currentTask.status = status;
      if (status === "DONE") {
        currentTask.completedAt = new Date().toISOString();
        // Regra 1 e 2: Criar próxima ocorrência da série recorrente
        handleTaskCompletionRecurrence(currentTask, user);
      } else {
        currentTask.completedAt = null;
      }
    }
  } else if (waitingReason !== undefined) {
    currentTask.waitingReason = waitingReason;
  }

  // Regra 5: Atualizar toda a série caso applyToSeries seja verdadeiro
  if (req.body.applyToSeries === true && currentTask.seriesId) {
    mockDb.tasks.forEach((t) => {
      if (t.seriesId === currentTask.seriesId && t.status !== "DONE" && t.id !== currentTask.id && !t.deletedAt) {
        if (title !== undefined) t.title = currentTask.title;
        if (descriptionMarkdown !== undefined) t.descriptionMarkdown = currentTask.descriptionMarkdown;
        if (priority !== undefined) t.priority = currentTask.priority;
        if (area !== undefined) t.area = currentTask.area;
        if (visibility !== undefined) t.visibility = currentTask.visibility;
        t.updatedAt = new Date().toISOString();
      }
    });
  }

  currentTask.updatedAt = new Date().toISOString();
  const actualIndex = mockDb.tasks.findIndex((t) => t.id === currentTask.id);
  if (actualIndex !== -1) {
    mockDb.tasks[actualIndex] = currentTask;
  }

  res.json({ task: enrichTask(currentTask, today) });
}

/**
 * PATCH /api/tasks/:id/status
 * Rota rápida para drag-and-drop de Kanban
 */
export async function updateTaskStatus(req: Request, res: Response): Promise<void> {
  return updateTask(req, res);
}

/**
 * POST /api/tasks/:id/approve
 * Aprovação do cliente: move para DONE, grava approvedByUserId e approvedAt (spec 8.3)
 */
export async function approveTask(req: Request, res: Response): Promise<void> {
  const user = req.user as any;
  const id = String(req.params.id);
  const today = new Date().toISOString().split("T")[0];

  if (user?.growthRole === "CLIENT_ATTENDANT") {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  const task = mockDb.tasks.find((t) => t.id === id && !t.deletedAt);
  if (!task) {
    res.status(404).json({ error: "Tarefa não encontrada" });
    return;
  }

  if (user?.growthRole === "CLIENT_OWNER" && (task.clientId !== user.clientId || task.visibility !== "CLIENT")) {
    res.status(404).json({ error: "Tarefa não encontrada" });
    return;
  }

  if (task.status !== "AWAITING_APPROVAL") {
    res.status(409).json({ error: "Apenas tarefas em Aguardando Aprovação podem ser aprovadas" });
    return;
  }

  task.status = "DONE";
  task.completedAt = new Date().toISOString();
  task.approvedByUserId = user?.id || "usr_client";
  task.approvedAt = new Date().toISOString();
  task.updatedAt = new Date().toISOString();

  // Regra 1 e 2: Criar próxima ocorrência da série recorrente
  handleTaskCompletionRecurrence(task, user);

  mockDb.taskHistory = mockDb.taskHistory || [];
  mockDb.taskHistory.push({
    id: `his_${Date.now()}`,
    taskId: task.id,
    type: "APPROVED",
    from: "AWAITING_APPROVAL",
    to: "DONE",
    authorName: user?.name || "Cliente",
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true, task: enrichTask(task, today) });
}

/**
 * POST /api/tasks/:id/request-changes
 * Solicitação de ajustes do cliente: cria comentário e move para IN_PROGRESS (spec 8.3)
 */
export async function requestTaskChanges(req: Request, res: Response): Promise<void> {
  const user = req.user as any;
  const id = String(req.params.id);
  const today = new Date().toISOString().split("T")[0];

  if (user?.growthRole === "CLIENT_ATTENDANT") {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  const task = mockDb.tasks.find((t) => t.id === id && !t.deletedAt);
  if (!task) {
    res.status(404).json({ error: "Tarefa não encontrada" });
    return;
  }

  if (user?.growthRole === "CLIENT_OWNER" && (task.clientId !== user.clientId || task.visibility !== "CLIENT")) {
    res.status(404).json({ error: "Tarefa não encontrada" });
    return;
  }

  const { comment } = req.body;
  if (!comment || !String(comment).trim()) {
    res.status(400).json({ error: "Comentário é obrigatório para pedir ajuste" });
    return;
  }

  if (task.status !== "AWAITING_APPROVAL") {
    res.status(409).json({ error: "Apenas tarefas em Aguardando Aprovação podem ter ajustes solicitados" });
    return;
  }

  task.status = "IN_PROGRESS";
  task.updatedAt = new Date().toISOString();

  // Registrar comentário público (cliente vê)
  mockDb.taskComments = mockDb.taskComments || [];
  mockDb.taskComments.push({
    id: `cmt_${Date.now()}`,
    taskId: task.id,
    authorId: user?.id || "usr_client",
    authorName: user?.name || "Cliente",
    body: String(comment).trim(),
    internal: false,
    createdAt: new Date().toISOString(),
  });

  // Registrar no histórico
  mockDb.taskHistory = mockDb.taskHistory || [];
  mockDb.taskHistory.push({
    id: `his_${Date.now()}`,
    taskId: task.id,
    type: "CHANGES_REQUESTED",
    from: "AWAITING_APPROVAL",
    to: "IN_PROGRESS",
    authorName: user?.name || "Cliente",
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true, task: enrichTask(task, today) });
}


/**
 * PATCH /api/tasks/:id/checklist/:checklistId
 */
export async function toggleChecklistItem(req: Request, res: Response): Promise<void> {
  const user = req.user as any;
  const id = String(req.params.id);
  const checklistId = String(req.params.checklistId);
  const today = new Date().toISOString().split("T")[0];

  // RBAC 5.2: Cliente não pode marcar checklist
  if (user?.growthRole === "CLIENT_OWNER" || user?.growthRole === "CLIENT_ATTENDANT") {
    res.status(403).json({ error: "Apenas membros da agência podem marcar itens de checklist" });
    return;
  }

  const task = mockDb.tasks.find((t) => t.id === id && !t.deletedAt);
  if (!task || !task.checklists) {
    res.status(404).json({ error: "Tarefa ou checklist não encontrado" });
    return;
  }

  const item = task.checklists.find((c) => c.id === checklistId);
  if (!item) {
    res.status(404).json({ error: "Item do checklist não encontrado" });
    return;
  }

  item.done = !item.done;
  task.updatedAt = new Date().toISOString();

  res.json({ success: true, task: enrichTask(task, today) });
}

/**
 * DELETE /api/tasks/:id
 * Exclusão lógica (deletedAt) restrita a papéis de agência. Retorna 204.
 */
export async function deleteTask(req: Request, res: Response): Promise<void> {
  const user = req.user as any;
  const id = String(req.params.id);

  if (user?.growthRole === "CLIENT_OWNER" || user?.growthRole === "CLIENT_ATTENDANT") {
    res.status(403).json({ error: "Apenas membros da agência podem excluir tarefas" });
    return;
  }

  const task = mockDb.tasks.find((t) => t.id === id && !t.deletedAt);
  if (!task) {
    res.status(404).json({ error: "Tarefa não encontrada" });
    return;
  }

  task.deletedAt = new Date().toISOString();
  res.status(204).send();
}

/**
 * GET /api/tasks/:id/comments
 */
export async function listTaskComments(req: Request, res: Response): Promise<void> {
  const user = req.user as any;
  const id = String(req.params.id);

  if (user?.growthRole === "CLIENT_ATTENDANT") {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  const task = mockDb.tasks.find((t) => t.id === id && !t.deletedAt);
  if (!task) {
    res.status(404).json({ error: "Tarefa não encontrada" });
    return;
  }

  if (user?.growthRole === "CLIENT_OWNER" && (task.clientId !== user.clientId || task.visibility !== "CLIENT")) {
    res.status(404).json({ error: "Tarefa não encontrada" });
    return;
  }

  const isClient = user?.growthRole === "CLIENT_OWNER";
  const comments = (mockDb.taskComments || [])
    .filter((c) => c.taskId === id && (!isClient || !c.internal))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  res.json({ comments });
}

/**
 * POST /api/tasks/:id/comments
 */
export async function createTaskComment(req: Request, res: Response): Promise<void> {
  const user = req.user as any;
  const id = String(req.params.id);

  if (user?.growthRole === "CLIENT_ATTENDANT") {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  const task = mockDb.tasks.find((t) => t.id === id && !t.deletedAt);
  if (!task) {
    res.status(404).json({ error: "Tarefa não encontrada" });
    return;
  }

  if (user?.growthRole === "CLIENT_OWNER" && (task.clientId !== user.clientId || task.visibility !== "CLIENT")) {
    res.status(404).json({ error: "Tarefa não encontrada" });
    return;
  }

  const { body, internal } = req.body;
  if (!body || !String(body).trim()) {
    res.status(400).json({ error: "Comentário não pode estar vazio" });
    return;
  }

  // Clientes não podem criar comentários internos
  const isInternal = user?.growthRole === "CLIENT_OWNER" ? false : Boolean(internal);

  const newComment = {
    id: `cmt_${Date.now()}`,
    taskId: id,
    authorId: user?.id || "usr_gisley",
    authorName: user?.name || "Gisley Fernandes",
    body: String(body).trim(),
    internal: isInternal,
    createdAt: new Date().toISOString(),
  };

  mockDb.taskComments = mockDb.taskComments || [];
  mockDb.taskComments.push(newComment);

  res.status(201).json({ comment: newComment });
}

/**
 * GET /api/tasks/:id/history
 */
export async function listTaskHistory(req: Request, res: Response): Promise<void> {
  const user = req.user as any;
  const id = String(req.params.id);

  if (user?.growthRole === "CLIENT_ATTENDANT") {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  const task = mockDb.tasks.find((t) => t.id === id && !t.deletedAt);
  if (!task) {
    res.status(404).json({ error: "Tarefa não encontrada" });
    return;
  }

  if (user?.growthRole === "CLIENT_OWNER" && (task.clientId !== user.clientId || task.visibility !== "CLIENT")) {
    res.status(404).json({ error: "Tarefa não encontrada" });
    return;
  }

  const events = (mockDb.taskHistory || [])
    .filter((h) => h.taskId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ events });
}

/**
 * GET /api/tasks/config
 */
export async function getTaskConfig(req: Request, res: Response): Promise<void> {
  res.json({ timeTrackingEnabled: Boolean(mockDb.timeTrackingEnabled) });
}

/**
 * PATCH /api/tasks/config
 */
export async function updateTaskConfig(req: Request, res: Response): Promise<void> {
  const user = req.user as any;
  if (user?.growthRole === "CLIENT_OWNER" || user?.growthRole === "CLIENT_ATTENDANT") {
    res.status(403).json({ error: "Apenas agência pode alterar configurações de tarefas" });
    return;
  }

  mockDb.timeTrackingEnabled = Boolean(req.body.timeTrackingEnabled);
  res.json({ timeTrackingEnabled: mockDb.timeTrackingEnabled });
}

