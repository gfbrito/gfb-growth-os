import { Request, Response } from "express";
import { mockDb, MockTask } from "../../services/mockDb.js";

export async function listTasks(req: Request, res: Response): Promise<void> {
  const { clientId, status, assignedUserId, priority } = req.query;

  let tasks = [...mockDb.tasks];

  if (clientId) {
    tasks = tasks.filter((t) => t.clientId === clientId);
  }
  if (status) {
    tasks = tasks.filter((t) => t.status === status);
  }
  if (assignedUserId) {
    tasks = tasks.filter((t) => t.assignedUserId === assignedUserId);
  }
  if (priority) {
    tasks = tasks.filter((t) => t.priority === priority);
  }

  // Populate client and assignee names
  const enriched = tasks.map((t) => ({
    ...t,
    clientName: mockDb.clients.find((c) => c.id === t.clientId)?.name || "Geral",
    assigneeName: mockDb.users.find((u) => u.id === t.assignedUserId)?.name || "Não atribuído",
    assigneeAvatar: mockDb.users.find((u) => u.id === t.assignedUserId)?.avatarUrl || "",
  }));

  res.json({ tasks: enriched });
}

export async function createTask(req: Request, res: Response): Promise<void> {
  const { clientId, title, descriptionMarkdown, priority, dueDate, timeEstimateMinutes, labels } = req.body;

  if (!title) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const newTask: MockTask = {
    id: `tsk_${Date.now()}`,
    clientId: clientId || "cli_bruna_ppp",
    title,
    descriptionMarkdown: descriptionMarkdown || "",
    status: "TODO",
    priority: priority || "NORMAL",
    assignedUserId: req.user?.id || "usr_gestor",
    dueDate: dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    timeEstimateMinutes: Number(timeEstimateMinutes) || 60,
    timeSpentMinutes: 0,
    labels: labels || ["Tráfego"],
  };

  mockDb.tasks.unshift(newTask);

  res.status(201).json({ task: newTask });
}

export async function updateTaskStatus(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const { status, priority, timeSpentMinutes } = req.body;

  const taskIndex = mockDb.tasks.findIndex((t) => t.id === id);

  if (taskIndex === -1) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  if (status) mockDb.tasks[taskIndex].status = status;
  if (priority) mockDb.tasks[taskIndex].priority = priority;
  if (timeSpentMinutes !== undefined) mockDb.tasks[taskIndex].timeSpentMinutes = Number(timeSpentMinutes);

  res.json({ task: mockDb.tasks[taskIndex] });
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const taskIndex = mockDb.tasks.findIndex((t) => t.id === id);

  if (taskIndex === -1) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  mockDb.tasks.splice(taskIndex, 1);
  res.json({ message: "Task deleted successfully" });
}
