import type { Task, TaskCounts, AssignableUser, TaskStatus } from './taskTypes';

function getHeaders(viewerRole?: string, clientId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (viewerRole) headers['X-User-Role'] = viewerRole;
  if (clientId) headers['X-Client-Id'] = clientId;
  return headers;
}

export interface FetchTasksParams {
  clientId?: string | null;
  status?: string;
  priority?: string;
  kind?: string;
  area?: string;
  assignedUserId?: string;
  overdue?: boolean;
  dueToday?: boolean;
  q?: string;
}

export async function fetchTasks(
  params: FetchTasksParams = {},
  viewerRole?: string
): Promise<{ tasks: Task[]; counts: TaskCounts }> {
  const query = new URLSearchParams();
  if (params.clientId) query.set('clientId', params.clientId);
  if (params.status) query.set('status', params.status);
  if (params.priority) query.set('priority', params.priority);
  if (params.kind) query.set('kind', params.kind);
  if (params.area) query.set('area', params.area);
  if (params.assignedUserId) query.set('assignedUserId', params.assignedUserId);
  if (params.overdue) query.set('overdue', 'true');
  if (params.dueToday) query.set('dueToday', 'true');
  if (params.q) query.set('q', params.q);

  const url = `/api/tasks${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await fetch(url, { headers: getHeaders(viewerRole, params.clientId || undefined) });
  if (!res.ok) {
    throw new Error('Falha ao carregar tarefas');
  }
  return res.json();
}

export async function fetchTaskById(id: string, viewerRole?: string): Promise<{ task: Task }> {
  const res = await fetch(`/api/tasks/${id}`, { headers: getHeaders(viewerRole) });
  if (!res.ok) {
    throw new Error('Falha ao carregar detalhes da tarefa');
  }
  return res.json();
}

export async function createTask(
  taskData: Partial<Task>,
  viewerRole?: string
): Promise<{ task: Task }> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: getHeaders(viewerRole, taskData.clientId || undefined),
    body: JSON.stringify(taskData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao criar tarefa');
  }
  return res.json();
}

export async function updateTask(
  id: string,
  taskData: Partial<Task>,
  viewerRole?: string
): Promise<{ task: Task }> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: getHeaders(viewerRole),
    body: JSON.stringify(taskData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao atualizar tarefa');
  }
  return res.json();
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
  viewerRole?: string
): Promise<{ task: Task }> {
  return updateTask(id, { status }, viewerRole);
}

export async function toggleChecklistItem(
  taskId: string,
  checklistId: string,
  viewerRole?: string
): Promise<{ success: boolean; task: Task }> {
  const res = await fetch(`/api/tasks/${taskId}/checklist/${checklistId}`, {
    method: 'PATCH',
    headers: getHeaders(viewerRole),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao atualizar checklist');
  }
  return res.json();
}

export async function deleteTask(
  id: string,
  viewerRole?: string
): Promise<{ success: boolean }> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
    headers: getHeaders(viewerRole),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao excluir tarefa');
  }
  return { success: true };
}

export async function fetchAssignableUsers(viewerRole?: string): Promise<{ users: AssignableUser[] }> {
  const res = await fetch('/api/users?assignable=true', { headers: getHeaders(viewerRole) });
  if (!res.ok) {
    return { users: [] };
  }
  return res.json();
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  body: string;
  internal: boolean;
  createdAt: string;
}

export interface TaskHistoryEvent {
  id: string;
  taskId: string;
  type: string;
  from?: any;
  to?: any;
  authorName: string;
  createdAt: string;
}

export async function fetchTaskComments(taskId: string, viewerRole?: string): Promise<{ comments: TaskComment[] }> {
  const res = await fetch(`/api/tasks/${taskId}/comments`, { headers: getHeaders(viewerRole) });
  if (!res.ok) return { comments: [] };
  return res.json();
}

export async function createTaskComment(
  taskId: string,
  data: { body: string; internal: boolean },
  viewerRole?: string
): Promise<{ comment: TaskComment }> {
  const res = await fetch(`/api/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: getHeaders(viewerRole),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao criar comentário');
  }
  return res.json();
}

export async function fetchTaskHistory(taskId: string, viewerRole?: string): Promise<{ events: TaskHistoryEvent[] }> {
  const res = await fetch(`/api/tasks/${taskId}/history`, { headers: getHeaders(viewerRole) });
  if (!res.ok) return { events: [] };
  return res.json();
}

export async function fetchTaskConfig(viewerRole?: string): Promise<{ timeTrackingEnabled: boolean }> {
  const res = await fetch('/api/tasks/config', { headers: getHeaders(viewerRole) });
  if (!res.ok) return { timeTrackingEnabled: false };
  return res.json();
}

export async function updateTaskConfig(
  enabled: boolean,
  viewerRole?: string
): Promise<{ timeTrackingEnabled: boolean }> {
  const res = await fetch('/api/tasks/config', {
    method: 'PATCH',
    headers: getHeaders(viewerRole),
    body: JSON.stringify({ timeTrackingEnabled: enabled }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao atualizar configuração');
  }
  return res.json();
}

export async function approveTask(taskId: string, viewerRole?: string): Promise<{ success: boolean; task: Task }> {
  const res = await fetch(`/api/tasks/${taskId}/approve`, {
    method: 'POST',
    headers: getHeaders(viewerRole),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao aprovar tarefa');
  }
  return res.json();
}

export async function requestTaskChanges(
  taskId: string,
  comment: string,
  viewerRole?: string
): Promise<{ success: boolean; task: Task }> {
  const res = await fetch(`/api/tasks/${taskId}/request-changes`, {
    method: 'POST',
    headers: getHeaders(viewerRole),
    body: JSON.stringify({ comment }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao solicitar ajustes');
  }
  return res.json();
}

export async function endTaskSeries(
  taskId: string,
  viewerRole?: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/tasks/${taskId}/end-series`, {
    method: 'POST',
    headers: getHeaders(viewerRole),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao encerrar série');
  }
  return res.json();
}

export async function fetchTaskRoutines(
  viewerRole?: string
): Promise<{ routines: any[] }> {
  const res = await fetch('/api/task-routines', {
    headers: getHeaders(viewerRole),
  });
  if (!res.ok) {
    throw new Error('Erro ao carregar rotinas operacionais');
  }
  return res.json();
}

export async function createTaskRoutine(
  routineData: any,
  viewerRole?: string
): Promise<{ routine: any }> {
  const res = await fetch('/api/task-routines', {
    method: 'POST',
    headers: getHeaders(viewerRole),
    body: JSON.stringify(routineData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao criar rotina');
  }
  return res.json();
}

export async function updateTaskRoutine(
  id: string,
  routineData: any,
  viewerRole?: string
): Promise<{ routine: any }> {
  const res = await fetch(`/api/task-routines/${id}`, {
    method: 'PATCH',
    headers: getHeaders(viewerRole),
    body: JSON.stringify(routineData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao atualizar rotina');
  }
  return res.json();
}

export async function deleteTaskRoutine(
  id: string,
  viewerRole?: string
): Promise<void> {
  const res = await fetch(`/api/task-routines/${id}`, {
    method: 'DELETE',
    headers: getHeaders(viewerRole),
  });
  if (!res.ok) {
    throw new Error('Erro ao excluir rotina');
  }
}

export async function fetchClientRoutines(
  clientId?: string,
  viewerRole?: string
): Promise<{ subscriptions: any[] }> {
  const url = clientId ? `/api/clients/${clientId}/task-routines` : '/api/clients/routines';
  const res = await fetch(url, {
    headers: getHeaders(viewerRole),
  });
  if (!res.ok) {
    throw new Error('Erro ao carregar rotinas dos clientes');
  }
  return res.json();
}

export async function setClientRoutine(
  clientId: string,
  routineId: string,
  data: { enabled: boolean; assignedUserId?: string },
  viewerRole?: string
): Promise<{ success: boolean; enabled: boolean; subscription?: any }> {
  const res = await fetch(`/api/clients/${clientId}/task-routines/${routineId}`, {
    method: 'PUT',
    headers: getHeaders(viewerRole),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao alterar rotina do cliente');
  }
  return res.json();
}

