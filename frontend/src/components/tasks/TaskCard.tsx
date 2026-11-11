import React from 'react';
import { Clock, CheckSquare, AlertCircle, Building2, User, MessageSquare, Repeat } from 'lucide-react';
import {
  type Task,
  type TaskScope,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  AREA_CONFIG,
  VISIBILITY_CONFIG,
} from './taskTypes';

interface TaskCardProps {
  task: Task;
  scope: TaskScope;
  onSelect: (task: Task) => void;
  viewerRole?: string;
  timeTrackingEnabled?: boolean;
}

export function TaskCard({
  task,
  scope,
  onSelect,
  viewerRole,
  timeTrackingEnabled = false,
}: TaskCardProps) {
  const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.NORMAL;
  const areaInfo = task.area ? AREA_CONFIG[task.area] : null;
  const isAgencyScope = scope.kind === 'agency';

  const checklists = task.checklists || [];
  const doneChecklists = checklists.filter((c) => c.done).length;
  const totalChecklists = checklists.length;

  return (
    <div
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
      }}
      onClick={() => onSelect(task)}
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: task.isOverdue ? '1px solid #F43F5E' : '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '14px 16px',
        cursor: 'grab',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: task.isOverdue ? '0 4px 20px rgba(244, 63, 94, 0.15)' : '0 4px 14px rgba(0, 0, 0, 0.2)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = task.isOverdue ? '#F43F5E' : 'rgba(56, 189, 248, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = task.isOverdue ? '#F43F5E' : 'var(--border-subtle)';
      }}
    >
      {/* Top Header: Area, Priority, Overdue & Visibility */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {task.isOverdue && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#fff',
                background: '#F43F5E',
                padding: '2px 7px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <AlertCircle size={11} /> Atrasada
            </span>
          )}
          {areaInfo && (
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '2px 7px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{areaInfo.iconEmoji}</span>
              <span>{areaInfo.label}</span>
            </span>
          )}

          {isAgencyScope && task.visibility === 'INTERNAL' && (
            <span
              style={{
                fontSize: '0.65rem',
                color: '#CBD5E1',
                background: 'rgba(100, 116, 139, 0.2)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
            >
              🔒 Interna
            </span>
          )}

          {task.seriesId && (
            <span
              title="Tarefa recorrente (série)"
              style={{
                fontSize: '0.65rem',
                fontWeight: 600,
                color: '#38BDF8',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '1px 6px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Repeat size={10} /> Recorrente
            </span>
          )}
        </div>

        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: priorityInfo.color,
            background: `${priorityInfo.color}18`,
            border: `1px solid ${priorityInfo.color}35`,
            padding: '2px 8px',
            borderRadius: '12px',
          }}
        >
          {priorityInfo.label}
        </span>
      </div>

      {/* Task Title */}
      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', lineHeight: 1.35 }}>
        {task.title}
      </div>

      {/* Waiting Reason alert on card */}
      {task.status === 'WAITING' && task.waitingReason && (
        <div
          style={{
            fontSize: '0.72rem',
            color: '#F59E0B',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '6px',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Clock size={12} />
          <span><strong>Esperando:</strong> {task.waitingReason}</span>
        </div>
      )}

      {/* Client indicator in Agency Scope */}
      {isAgencyScope && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
          <Building2 size={12} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.clientName || 'Interna (Agência)'}
          </span>
        </div>
      )}

      {/* Footer Info: Checklists, Due Date & Assignee */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          fontSize: '0.72rem',
          color: 'var(--text-dim)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {totalChecklists > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: doneChecklists === totalChecklists ? 'var(--accent-green)' : 'inherit' }}>
              <CheckSquare size={13} />
              <span>{doneChecklists}/{totalChecklists}</span>
            </div>
          )}

          {Boolean(task.commentCount && task.commentCount > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent-purple)' }}>
              <MessageSquare size={12} />
              <span>{task.commentCount}</span>
            </div>
          )}

          {timeTrackingEnabled && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent-cyan)' }}>
              <Clock size={11} />
              <span>{task.timeSpentMinutes || 0}m / {task.timeEstimateMinutes || 0}m</span>
            </div>
          )}

          {task.dueDate && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: task.isOverdue ? '#EF4444' : 'inherit',
                fontWeight: task.isOverdue ? 700 : 400,
              }}
            >
              {task.isOverdue ? <AlertCircle size={13} /> : <Clock size={13} />}
              <span>{task.dueDate.split('-').reverse().slice(0, 2).join('/')}</span>
            </div>
          )}
        </div>

        {/* Assignee Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {task.assigneeAvatar ? (
            <img
              src={task.assigneeAvatar}
              alt={task.assigneeName || 'Responsável'}
              title={task.assigneeName || 'Responsável'}
              style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid var(--accent-cyan)' }}
            />
          ) : (
            <span
              title="Sem responsável"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-dim)',
              }}
            >
              <User size={12} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
