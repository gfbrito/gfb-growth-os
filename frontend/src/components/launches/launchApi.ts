import type {
  Launch,
  LaunchGroup,
  LaunchParticipant,
  LaunchMetrics,
  LaunchMessage,
  LaunchScheduledGroupAction,
  LaunchInboxMessage,
  LaunchWebhook,
  LaunchWebhookDelivery,
  LaunchAnalytics,
} from './launchTypes';

const BASE_URL = '/api/launches';

export async function fetchLaunches(clientId?: string): Promise<Launch[]> {
  const url = clientId ? `${BASE_URL}?clientId=${encodeURIComponent(clientId)}` : BASE_URL;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao listar lançamentos');
  const data = await res.json();
  return data.launches || [];
}

export async function createLaunch(payload: Partial<Launch>): Promise<Launch> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao criar lançamento');
  }
  const data = await res.json();
  return data.launch;
}

export async function getLaunch(id: string): Promise<Launch> {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error('Lançamento não encontrado');
  const data = await res.json();
  return data.launch;
}

export async function updateLaunch(id: string, payload: Partial<Launch>): Promise<Launch> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao atualizar lançamento');
  }
  const data = await res.json();
  return data.launch;
}

export async function deleteLaunch(id: string, confirmationName?: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmationName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao excluir lançamento');
  }
}

export async function fetchLaunchDashboard(id: string): Promise<LaunchMetrics> {
  const res = await fetch(`${BASE_URL}/${id}/dashboard`);
  if (!res.ok) throw new Error('Falha ao carregar métricas do dashboard');
  return res.json();
}

export async function fetchLaunchGroups(id: string): Promise<LaunchGroup[]> {
  const res = await fetch(`${BASE_URL}/${id}/groups`);
  if (!res.ok) throw new Error('Falha ao carregar grupos');
  const data = await res.json();
  return data.groups || [];
}

export async function enqueueGroups(id: string, count: number): Promise<LaunchGroup[]> {
  const res = await fetch(`${BASE_URL}/${id}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count }),
  });
  if (!res.ok) throw new Error('Falha ao criar grupos');
  const data = await res.json();
  return data.groups || [];
}

export async function linkExistingGroup(id: string, payload: { jid: string; name: string; inviteUrl?: string }): Promise<LaunchGroup> {
  const res = await fetch(`${BASE_URL}/${id}/groups/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Falha ao vincular grupo');
  const data = await res.json();
  return data.group;
}

export async function fetchLinkableGroups(id: string): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/${id}/groups/linkable`);
  if (!res.ok) throw new Error('Falha ao buscar grupos disponíveis');
  const data = await res.json();
  return data.groups || [];
}

export async function syncGroups(id: string): Promise<LaunchGroup[]> {
  const res = await fetch(`${BASE_URL}/${id}/groups/sync`, { method: 'POST' });
  if (!res.ok) throw new Error('Falha ao sincronizar grupos');
  const data = await res.json();
  return data.groups || [];
}

export async function updateGroup(id: string, groupId: string, payload: Partial<LaunchGroup>): Promise<LaunchGroup> {
  const res = await fetch(`${BASE_URL}/${id}/groups/${groupId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Falha ao atualizar grupo');
  const data = await res.json();
  return data.group;
}

export async function removeGroup(id: string, groupId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}/groups/${groupId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao desvincular grupo');
}

export async function fetchGroupParticipants(id: string, groupId: string): Promise<LaunchParticipant[]> {
  const res = await fetch(`${BASE_URL}/${id}/groups/${groupId}/participants`);
  if (!res.ok) throw new Error('Falha ao carregar participantes');
  const data = await res.json();
  return data.participants || [];
}

export async function fetchLaunchLeads(
  id: string,
  filters?: { status?: string; classification?: string; search?: string; sort?: string }
): Promise<{ participants: LaunchParticipant[]; stats: any }> {
  const query = new URLSearchParams(filters as any).toString();
  const res = await fetch(`${BASE_URL}/${id}/leads?${query}`);
  if (!res.ok) throw new Error('Falha ao carregar leads');
  const data = await res.json();
  const participants = data.participants || data.leads || [];
  const stats = data.stats || {
    total: data.counts?.total ?? participants.length,
    active: data.counts?.active ?? 0,
    left: data.counts?.left ?? 0,
    hot: data.counts?.hot ?? 0,
    enriched: data.counts?.enriched ?? 0,
  };
  return { participants, stats };
}

export async function enrichLeads(id: string): Promise<{ matchedCount: number }> {
  const res = await fetch(`${BASE_URL}/${id}/leads/enrich`, { method: 'POST' });
  if (!res.ok) throw new Error('Falha ao sincronizar com CRM');
  return res.json();
}

export async function fetchLaunchMessages(id: string): Promise<LaunchMessage[]> {
  const res = await fetch(`${BASE_URL}/${id}/messages`);
  if (!res.ok) throw new Error('Falha ao carregar mensagens');
  const data = await res.json();
  return data.messages || [];
}

export async function createLaunchMessage(id: string, payload: Partial<LaunchMessage>): Promise<LaunchMessage> {
  const res = await fetch(`${BASE_URL}/${id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Falha ao agendar mensagem');
  const data = await res.json();
  return data.message;
}

export async function cancelLaunchMessage(id: string, messageId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}/messages/${messageId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao cancelar mensagem');
}

export async function fetchPrivateMessages(id: string): Promise<LaunchMessage[]> {
  const res = await fetch(`${BASE_URL}/${id}/private-messages`);
  if (!res.ok) throw new Error('Falha ao carregar mensagens privadas');
  const data = await res.json();
  return data.messages || [];
}

export async function createPrivateMessage(id: string, payload: Partial<LaunchMessage>): Promise<LaunchMessage> {
  const res = await fetch(`${BASE_URL}/${id}/private-messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Falha ao disparar mensagens privadas');
  const data = await res.json();
  return data.message;
}

export async function fetchLaunchActions(id: string): Promise<LaunchScheduledGroupAction[]> {
  const res = await fetch(`${BASE_URL}/${id}/actions`);
  if (!res.ok) throw new Error('Falha ao carregar ações agendadas');
  const data = await res.json();
  return data.actions || [];
}

export async function createLaunchAction(id: string, payload: Partial<LaunchScheduledGroupAction>): Promise<LaunchScheduledGroupAction> {
  const res = await fetch(`${BASE_URL}/${id}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Falha ao agendar ação');
  const data = await res.json();
  return data.action;
}

export async function cancelLaunchAction(id: string, actionId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}/actions/${actionId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao cancelar ação');
}

export async function fetchLaunchAnalytics(id: string, period?: string): Promise<LaunchAnalytics> {
  const url = period ? `${BASE_URL}/${id}/analytics?period=${period}` : `${BASE_URL}/${id}/analytics`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao carregar analytics');
  return res.json();
}

export async function fetchLaunchInbox(id: string, status?: string): Promise<LaunchInboxMessage[]> {
  const url = status ? `${BASE_URL}/${id}/inbox?status=${status}` : `${BASE_URL}/${id}/inbox`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Falha ao carregar inbox');
  const data = await res.json();
  return data.messages || [];
}

export async function sendInboxReply(id: string, inboxId: string, replyText?: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}/inbox/${inboxId}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ replyText }),
  });
  if (!res.ok) throw new Error('Falha ao enviar resposta');
}

export async function rejectInboxReply(id: string, inboxId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}/inbox/${inboxId}/reject`, { method: 'POST' });
  if (!res.ok) throw new Error('Falha ao rejeitar resposta');
}

export async function ignoreInboxReply(id: string, inboxId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}/inbox/${inboxId}/ignore`, { method: 'POST' });
  if (!res.ok) throw new Error('Falha ao ignorar mensagem');
}

export async function fetchWebhooks(id: string): Promise<LaunchWebhook[]> {
  const res = await fetch(`${BASE_URL}/${id}/webhooks`);
  if (!res.ok) throw new Error('Falha ao carregar webhooks');
  const data = await res.json();
  return data.webhooks || [];
}

export async function createWebhook(id: string, payload: Partial<LaunchWebhook>): Promise<LaunchWebhook> {
  const res = await fetch(`${BASE_URL}/${id}/webhooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Falha ao criar webhook');
  const data = await res.json();
  return data.webhook;
}

export async function testWebhook(id: string, webhookId: string): Promise<LaunchWebhookDelivery> {
  const res = await fetch(`${BASE_URL}/${id}/webhooks/${webhookId}/test`, { method: 'POST' });
  if (!res.ok) throw new Error('Falha ao testar webhook');
  const data = await res.json();
  return data.delivery;
}

export async function fetchWebhookDeliveries(id: string, webhookId: string): Promise<LaunchWebhookDelivery[]> {
  const res = await fetch(`${BASE_URL}/${id}/webhooks/${webhookId}/deliveries`);
  if (!res.ok) throw new Error('Falha ao carregar histórico do webhook');
  const data = await res.json();
  return data.deliveries || [];
}

export async function fetchConnectedInstances(): Promise<Array<{ instanceKey: string; name: string; status: string; phone?: string }>> {
  const res = await fetch('/api/whatsapp/instances');
  if (!res.ok) return [];
  const data = await res.json();
  return data.instances || [];
}
