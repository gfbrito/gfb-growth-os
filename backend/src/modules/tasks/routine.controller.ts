import { Request, Response } from "express";
import { mockDb, MockTaskRoutine, MockRoutineTemplate, MockTask } from "../../services/mockDb.js";
import { getFirstScheduleDate, endTaskSeries } from "./recurrence.service.js";

/**
 * GET /api/task-routines
 * Lista todas as rotinas operacionais
 */
export async function listTaskRoutines(req: Request, res: Response): Promise<void> {
  res.json({ routines: mockDb.taskRoutines || [] });
}

/**
 * POST /api/task-routines
 * Cria uma nova rotina com modelos
 */
export async function createTaskRoutine(req: Request, res: Response): Promise<void> {
  const { name, description, templates } = req.body;

  if (!name || !String(name).trim()) {
    res.status(400).json({ error: "Nome da rotina é obrigatório" });
    return;
  }

  const newRoutine: MockTaskRoutine = {
    id: `rtn_${Date.now()}`,
    name: String(name).trim(),
    description: description ? String(description).trim() : "",
    templates: Array.isArray(templates)
      ? templates.map((tpl: any, idx: number) => ({
          id: tpl.id || `tpl_${Date.now()}_${idx}`,
          title: tpl.title || "Tarefa de Rotina",
          area: tpl.area || "OTHER",
          priority: tpl.priority || "NORMAL",
          visibility: tpl.visibility || "INTERNAL",
          frequency: tpl.frequency || "WEEKLY",
          weekday: tpl.weekday !== undefined ? Number(tpl.weekday) : 1,
          dayOfMonth: tpl.dayOfMonth !== undefined ? Number(tpl.dayOfMonth) : undefined,
          defaultChecklists: Array.isArray(tpl.defaultChecklists) ? tpl.defaultChecklists : [],
        }))
      : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockDb.taskRoutines.push(newRoutine);
  res.status(201).json({ routine: newRoutine });
}

/**
 * PATCH /api/task-routines/:id
 * Edita uma rotina existente
 */
export async function updateTaskRoutine(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const routine = mockDb.taskRoutines.find((r) => r.id === id);

  if (!routine) {
    res.status(404).json({ error: "Rotina não encontrada" });
    return;
  }

  const { name, description, templates } = req.body;

  if (name !== undefined) routine.name = String(name).trim();
  if (description !== undefined) routine.description = String(description).trim();
  if (Array.isArray(templates)) {
    routine.templates = templates.map((tpl: any, idx: number) => ({
      id: tpl.id || `tpl_${Date.now()}_${idx}`,
      title: tpl.title || "Tarefa de Rotina",
      area: tpl.area || "OTHER",
      priority: tpl.priority || "NORMAL",
      visibility: tpl.visibility || "INTERNAL",
      frequency: tpl.frequency || "WEEKLY",
      weekday: tpl.weekday !== undefined ? Number(tpl.weekday) : 1,
      dayOfMonth: tpl.dayOfMonth !== undefined ? Number(tpl.dayOfMonth) : undefined,
      defaultChecklists: Array.isArray(tpl.defaultChecklists) ? tpl.defaultChecklists : [],
    }));
  }
  routine.updatedAt = new Date().toISOString();

  res.json({ routine });
}

/**
 * DELETE /api/task-routines/:id
 * Exclui uma rotina
 */
export async function deleteTaskRoutine(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const index = mockDb.taskRoutines.findIndex((r) => r.id === id);

  if (index === -1) {
    res.status(404).json({ error: "Rotina não encontrada" });
    return;
  }

  mockDb.taskRoutines.splice(index, 1);
  res.status(204).send();
}

/**
 * GET /api/clients/routines
 * Lista inscrições de rotinas por cliente
 */
export async function listClientRoutines(req: Request, res: Response): Promise<void> {
  res.json({ subscriptions: mockDb.clientRoutineSubscriptions || [] });
}

/**
 * PUT /api/clients/:clientId/task-routines/:routineId
 * Ativa ou desativa uma rotina para um cliente (spec 9.2)
 * Ativar: pede o responsável padrão e cria a primeira ocorrência de cada modelo, com source = ROUTINE
 * Desativar: encerra as séries daquele cliente
 */
export async function setClientRoutine(req: Request, res: Response): Promise<void> {
  const clientId = String(req.params.clientId);
  const routineId = String(req.params.routineId);
  const { enabled, assignedUserId } = req.body;

  const client = mockDb.clients.find((c) => c.id === clientId);
  if (!client) {
    res.status(404).json({ error: "Cliente não encontrado" });
    return;
  }

  const routine = mockDb.taskRoutines.find((r) => r.id === routineId);
  if (!routine) {
    res.status(404).json({ error: "Rotina não encontrada" });
    return;
  }

  mockDb.clientRoutineSubscriptions = mockDb.clientRoutineSubscriptions || [];
  let subscription = mockDb.clientRoutineSubscriptions.find(
    (s) => s.clientId === clientId && s.routineId === routineId
  );

  const today = new Date().toISOString().split("T")[0];

  if (Boolean(enabled)) {
    // ATIVAR ROTINA
    const createdSeriesIds: string[] = [];
    const createdTasks: MockTask[] = [];

    for (const template of routine.templates) {
      const seriesId = `ser_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      createdSeriesIds.push(seriesId);

      const firstDueDate = getFirstScheduleDate(template, today);

      const newTask: MockTask = {
        id: `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        title: template.title,
        clientId: client.id,
        assignedUserId: assignedUserId || null,
        priority: template.priority,
        kind: "RECURRING",
        area: template.area,
        visibility: template.visibility,
        source: "ROUTINE",
        sourceRef: routine.id,
        descriptionMarkdown: `Tarefa gerada automaticamente pela rotina: **${routine.name}**.`,
        status: "TODO",
        dueDate: firstDueDate,
        waitingReason: null,
        timeEstimateMinutes: 60,
        timeSpentMinutes: 0,
        seriesId: seriesId,
        recurrence: {
          frequency: template.frequency,
          weekday: template.weekday,
          dayOfMonth: template.dayOfMonth,
          anchorDate: firstDueDate,
        },
        seriesEndedAt: null,
        checklists: (template.defaultChecklists || []).map((chkTitle, idx) => ({
          id: `chk_${Date.now()}_${idx}`,
          title: chkTitle,
          done: false,
          position: idx,
        })),
        attachments: [],
        createdByUserId: (req.user as any)?.id || "usr_system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        deletedAt: null,
      };

      mockDb.tasks.unshift(newTask);
      createdTasks.push(newTask);
    }

    if (subscription) {
      subscription.enabled = true;
      subscription.assignedUserId = assignedUserId;
      subscription.seriesIds = [...subscription.seriesIds, ...createdSeriesIds];
    } else {
      subscription = {
        clientId,
        routineId,
        enabled: true,
        assignedUserId,
        seriesIds: createdSeriesIds,
      };
      mockDb.clientRoutineSubscriptions.push(subscription);
    }

    res.json({ success: true, enabled: true, subscription, createdCount: createdTasks.length });
  } else {
    // DESATIVAR ROTINA: Encerra as séries ativas daquele cliente para essa rotina (spec 9.2)
    if (subscription) {
      subscription.enabled = false;
      const endedAt = new Date().toISOString();

      subscription.seriesIds.forEach((sId) => {
        mockDb.tasks.forEach((t) => {
          if (t.seriesId === sId) {
            t.seriesEndedAt = endedAt;
            t.updatedAt = endedAt;
          }
        });
      });
    }

    res.json({ success: true, enabled: false, subscription });
  }
}

/**
 * POST /api/tasks/:id/end-series
 * Encerrar série de uma tarefa (spec 9.1 regra 6)
 */
export async function endSeriesController(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const result = endTaskSeries(id);

  if (!result.success) {
    res.status(404).json({ error: result.error });
    return;
  }

  res.json({ success: true, message: "Série encerrada com sucesso" });
}
