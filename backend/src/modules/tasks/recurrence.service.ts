import { mockDb, MockTask, TaskRecurrence, MockRoutineTemplate } from "../../services/mockDb.js";

/**
 * Calcula a próxima data da agenda conforme regras da Parte 4 (spec 9.1):
 * - Semanal: todas as datas com aquele dia da semana.
 * - Quinzenal: anchorDate mais múltiplos de 14 dias.
 * - Mensal: o dia escolhido em cada mês; se o mês não tiver esse dia, o último dia do mês.
 *
 * Regra 2: O prazo da nova ocorrência é a primeira data da agenda DEPOIS da maior entre hoje e o prazo da ocorrência concluída.
 */
export function getNextOccurrenceDate(
  recurrence: TaskRecurrence,
  todayStr: string,
  completedDueDateStr?: string | null
): string {
  const baseDateStr = completedDueDateStr && completedDueDateStr > todayStr ? completedDueDateStr : todayStr;
  const [bY, bM, bD] = baseDateStr.split("-").map(Number);

  if (recurrence.frequency === "WEEKLY") {
    const targetWeekday = recurrence.weekday !== undefined ? recurrence.weekday : 1;
    let d = new Date(Date.UTC(bY, bM - 1, bD));
    while (true) {
      d.setUTCDate(d.getUTCDate() + 1);
      if (d.getUTCDay() === targetWeekday) {
        return d.toISOString().split("T")[0];
      }
    }
  }

  if (recurrence.frequency === "BIWEEKLY") {
    const anchor = recurrence.anchorDate || baseDateStr;
    const [aY, aM, aD] = anchor.split("-").map(Number);
    let d = new Date(Date.UTC(aY, aM - 1, aD));
    const target = new Date(Date.UTC(bY, bM - 1, bD));
    while (d <= target) {
      d.setUTCDate(d.getUTCDate() + 14);
    }
    return d.toISOString().split("T")[0];
  }

  if (recurrence.frequency === "MONTHLY") {
    let year = bY;
    let month = bM; // 1-12
    const targetDay = recurrence.dayOfMonth || 1;
    while (true) {
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const actualDay = Math.min(targetDay, lastDay);
      const cand = `${year}-${String(month).padStart(2, "0")}-${String(actualDay).padStart(2, "0")}`;
      if (cand > baseDateStr) {
        return cand;
      }
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }
  }

  // Fallback
  let next = new Date(Date.UTC(bY, bM - 1, bD));
  next.setUTCDate(next.getUTCDate() + 7);
  return next.toISOString().split("T")[0];
}

/**
 * Calcula o primeiro prazo de uma rotina ativada a partir de hoje (spec 9.2).
 */
export function getFirstScheduleDate(
  template: { frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY"; weekday?: number; dayOfMonth?: number },
  todayStr: string
): string {
  const [tY, tM, tD] = todayStr.split("-").map(Number);

  if (template.frequency === "WEEKLY") {
    const targetWeekday = template.weekday !== undefined ? template.weekday : 1;
    let d = new Date(Date.UTC(tY, tM - 1, tD));
    // Se hoje já for o dia da semana, começa hoje; senão busca o próximo
    while (d.getUTCDay() !== targetWeekday) {
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return d.toISOString().split("T")[0];
  }

  if (template.frequency === "BIWEEKLY") {
    const targetWeekday = template.weekday !== undefined ? template.weekday : 1;
    let d = new Date(Date.UTC(tY, tM - 1, tD));
    while (d.getUTCDay() !== targetWeekday) {
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return d.toISOString().split("T")[0];
  }

  if (template.frequency === "MONTHLY") {
    let year = tY;
    let month = tM;
    const targetDay = template.dayOfMonth || 1;
    while (true) {
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const actualDay = Math.min(targetDay, lastDay);
      const cand = `${year}-${String(month).padStart(2, "0")}-${String(actualDay).padStart(2, "0")}`;
      if (cand >= todayStr) {
        return cand;
      }
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }
  }

  return todayStr;
}

/**
 * Executa a lógica de recorrência na conclusão da tarefa (Regras 1, 2, 3 e 6).
 */
export function handleTaskCompletionRecurrence(task: MockTask, user: any): MockTask | null {
  if (!task.seriesId || !task.recurrence || task.seriesEndedAt) {
    return null;
  }

  // Regra 3: Nunca existem duas ocorrências abertas com o mesmo seriesId.
  const hasOpenOccurrence = mockDb.tasks.some(
    (t) => !t.deletedAt && t.seriesId === task.seriesId && t.id !== task.id && t.status !== "DONE"
  );
  if (hasOpenOccurrence) {
    return null;
  }

  const today = new Date().toISOString().split("T")[0];
  const nextDueDate = getNextOccurrenceDate(task.recurrence, today, task.dueDate);

  const nextTask: MockTask = {
    id: `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: task.title,
    clientId: task.clientId,
    assignedUserId: task.assignedUserId,
    priority: task.priority,
    kind: "RECURRING",
    area: task.area,
    visibility: task.visibility,
    source: task.source || "MANUAL",
    sourceRef: task.sourceRef,
    descriptionMarkdown: task.descriptionMarkdown || "",
    status: "TODO",
    dueDate: nextDueDate,
    waitingReason: null,
    timeEstimateMinutes: task.timeEstimateMinutes || 0,
    timeSpentMinutes: 0,
    seriesId: task.seriesId,
    recurrence: task.recurrence,
    seriesEndedAt: null,
    checklists: (task.checklists || []).map((c, idx) => ({
      id: `chk_${Date.now()}_${idx}`,
      title: c.title,
      done: false,
      position: idx,
    })),
    attachments: [...(task.attachments || [])],
    createdByUserId: user?.id || "usr_system",
    createdAt: new Date(Date.now() + 1000).toISOString(),
    updatedAt: new Date(Date.now() + 1000).toISOString(),
    completedAt: null,
    deletedAt: null,
  };

  mockDb.taskHistory = mockDb.taskHistory || [];
  mockDb.taskHistory.push({
    id: `his_${Date.now()}`,
    taskId: nextTask.id,
    type: "CREATED",
    authorName: "Sistema (Recorrência)",
    createdAt: new Date().toISOString(),
  });

  mockDb.tasks.push(nextTask);
  return nextTask;
}

/**
 * Validação da Regra 4: Reabrir ocorrência concluída quando a seguinte já existe.
 */
export function validateCanReopen(task: MockTask): { canReopen: boolean; error?: string } {
  if (!task.seriesId) {
    return { canReopen: true };
  }

  const taskCreatedAt = new Date(task.createdAt || 0).getTime();
  const hasNewer = mockDb.tasks.some(
    (t) =>
      !t.deletedAt &&
      t.seriesId === task.seriesId &&
      t.id !== task.id &&
      (
        t.status !== "DONE" ||
        new Date(t.createdAt || 0).getTime() > taskCreatedAt ||
        (t.dueDate && task.dueDate && t.dueDate > task.dueDate)
      )
  );

  if (hasNewer) {
    return {
      canReopen: false,
      error: "Já existe uma ocorrência mais recente desta série",
    };
  }

  return { canReopen: true };
}

/**
 * Regra 6: Encerrar série.
 */
export function endTaskSeries(taskId: string): { success: boolean; error?: string } {
  const task = mockDb.tasks.find((t) => t.id === taskId && !t.deletedAt);
  if (!task || !task.seriesId) {
    return { success: false, error: "Tarefa ou série recorrente não encontrada" };
  }

  const endedAt = new Date().toISOString();
  task.seriesEndedAt = endedAt;

  // Atualiza todas as tarefas pertencentes à mesma série
  mockDb.tasks.forEach((t) => {
    if (t.seriesId === task.seriesId) {
      t.seriesEndedAt = endedAt;
      t.updatedAt = endedAt;
    }
  });

  return { success: true };
}
