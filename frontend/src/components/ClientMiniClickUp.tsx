import React from 'react';
import { TaskBoard } from './tasks/TaskBoard';

interface ClientMiniClickUpProps {
  clientId?: string;
  clientName?: string;
  userRole?: 'MASTER_AGENCY' | 'CLIENT_OWNER' | 'CLIENT_ATTENDANT';
}

export function ClientMiniClickUp({
  clientId = '',
  clientName = 'Cliente',
  userRole = 'CLIENT_OWNER',
}: ClientMiniClickUpProps) {
  return (
    <TaskBoard
      scope={{ kind: 'client', clientId, clientName }}
      viewerRole={userRole}
    />
  );
}

export default ClientMiniClickUp;
