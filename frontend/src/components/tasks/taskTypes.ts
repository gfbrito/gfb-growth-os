export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'AWAITING_APPROVAL' | 'DONE';
export type TaskPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
export type TaskKind = 'RECURRING' | 'PROJECT';
export type TaskArea = 'META_ADS' | 'WHATSAPP' | 'AUTOMATION' | 'CREATIVE' | 'SITE_LP' | 'CRM' | 'OTHER';
export type TaskVisibility = 'INTERNAL' | 'CLIENT';
export type TaskSource = 'MANUAL' | 'ROUTINE' | 'SYSTEM';
export type RecurrenceFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface TaskRecurrence {
  frequency: RecurrenceFrequency;
  weekday?: number;
  dayOfMonth?: number;
  anchorDate: string;
}

export interface TaskOccurrenceSummary {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string | null;
  completedAt?: string | null;
}

export interface RoutineTemplate {
  id: string;
  title: string;
  descriptionMarkdown?: string;
  kind?: string;
  area: TaskArea;
  priority: TaskPriority;
  visibility: TaskVisibility;
  frequency: RecurrenceFrequency;
  weekday?: number;
  dayOfMonth?: number;
  defaultChecklists?: string[];
}

export type TaskRoutineTemplate = RoutineTemplate;
export type TaskRecurrenceFrequency = RecurrenceFrequency;

export interface TaskRoutine {
  id: string;
  name: string;
  description?: string;
  templates: RoutineTemplate[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientRoutineSubscription {
  clientId: string;
  routineId: string;
  enabled: boolean;
  assignedUserId?: string;
  seriesIds: string[];
}

export interface TaskChecklistItem {
  id: string;
  title: string;
  done: boolean;
  position?: number;
}

export interface TaskAttachment {
  id: string;
  title: string;
  url: string;
  createdAt?: string;
}

export interface Task {
  id: string;
  clientId?: string | null;
  clientName?: string;
  title: string;
  descriptionMarkdown?: string;
  status: TaskStatus;
  priority: TaskPriority;
  kind?: TaskKind;
  area?: TaskArea;
  visibility?: TaskVisibility;
  source?: TaskSource;
  sourceRef?: string | null;
  assignedUserId?: string | null;
  assigneeName?: string;
  assigneeAvatar?: string;
  dueDate?: string | null;
  waitingReason?: string | null;
  link?: string | null;
  checklists?: TaskChecklistItem[];
  attachments?: TaskAttachment[];
  timeEstimateMinutes?: number;
  timeSpentMinutes?: number;
  seriesId?: string | null;
  recurrence?: TaskRecurrence | null;
  seriesEndedAt?: string | null;
  seriesOccurrences?: TaskOccurrenceSummary[];
  applyToSeries?: boolean;
  approvedByUserId?: string | null;
  approvedAt?: string | null;
  createdByUserId?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
  isOverdue?: boolean;
  commentCount?: number;
}

export interface TaskCounts {
  open: number;
  overdue: number;
  awaitingApproval: number;
  dueToday: number;
}

export type TaskScope =
  | { kind: 'agency' }
  | { kind: 'client'; clientId: string; clientName: string };

export interface AssignableUser {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: string;
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; border: string }> = {
  TODO: { label: 'A Fazer', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.25)' },
  IN_PROGRESS: { label: 'Em Execução', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)' },
  WAITING: { label: 'Aguardando', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' },
  AWAITING_APPROVAL: { label: 'Aprovação do Cliente', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.25)' },
  DONE: { label: 'Concluído', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; badgeClass: string }> = {
  URGENT: { label: 'Urgente', color: '#EF4444', badgeClass: 'badge-red' },
  HIGH: { label: 'Alta', color: '#F97316', badgeClass: 'badge-amber' },
  NORMAL: { label: 'Normal', color: '#3B82F6', badgeClass: 'badge-cyan' },
  LOW: { label: 'Baixa', color: '#64748B', badgeClass: 'badge-gray' },
};

export const KIND_CONFIG: Record<TaskKind, { label: string }> = {
  PROJECT: { label: 'Projeto' },
  RECURRING: { label: 'Recorrente' },
};

export const AREA_CONFIG: Record<TaskArea, { label: string; iconEmoji: string }> = {
  META_ADS: { label: 'Meta Ads', iconEmoji: '🎯' },
  WHATSAPP: { label: 'WhatsApp', iconEmoji: '💬' },
  AUTOMATION: { label: 'Automação', iconEmoji: '⚡' },
  CREATIVE: { label: 'Criativos', iconEmoji: '🎨' },
  SITE_LP: { label: 'Site / LP', iconEmoji: '🌐' },
  CRM: { label: 'CRM', iconEmoji: '👥' },
  OTHER: { label: 'Outros', iconEmoji: '📌' },
};

export const VISIBILITY_CONFIG: Record<TaskVisibility, { label: string; color: string }> = {
  INTERNAL: { label: 'Interno (Agência)', color: '#94A3B8' },
  CLIENT: { label: 'Visível ao Cliente', color: '#38BDF8' },
};
