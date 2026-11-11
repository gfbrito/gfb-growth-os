export type LaunchStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED';
export type FillOrder = 'PROPORTIONAL' | 'SEQUENTIAL';

export interface Launch {
  id: string;
  clientId: string;
  name: string;
  slug: string;
  status: LaunchStatus;
  logoUrl?: string | null;
  description?: string | null;
  instanceKey: string;
  memberLimitPerGroup: number;
  autoCreateEnabled: boolean;
  autoCreateThresholdPercent: number;
  fillOrder: FillOrder;
  groupNamePattern: string;
  groupDescription: string;
  metaPixelId?: string | null;
  gtmContainerId?: string | null;
  aiEnabled: boolean;
  aiSystemPrompt?: string | null;
  aiAutoReply: boolean;
  currentMembers: number;
  maxMembers: number;
  groupCount: number;
  totalLeads: number;
  conversionRatePct: number;
  createdAt: string;
  updatedAt?: string;
}

export interface LaunchGroup {
  id: string;
  launchId: string;
  jid: string;
  name: string;
  inviteUrl: string;
  memberCount: number;
  maxMembers: number;
  position: number;
  status: 'RECEIVING' | 'PAUSED' | 'FULL' | 'CLOSED';
  isSynced: boolean;
  lastSyncAt: string;
}

export interface LaunchParticipant {
  id: string;
  launchId: string;
  phone: string;
  name?: string | null;
  crmLeadId?: string | null;
  groupIds: string[];
  status: 'ACTIVE' | 'LEFT' | 'BLOCKED';
  engagementScore: number;
  classification: 'HOT' | 'WARM' | 'COOL' | 'COLD';
  joinedAt: string;
  leftAt?: string | null;
  crmLead?: {
    id: string;
    email?: string;
    funnelStage?: string;
    totalSpent?: number;
    ordersCount?: number;
  } | null;
}

export interface LaunchMetrics {
  totalLeads: number;
  activeLeads: number;
  totalClicks: number;
  todayClicks: number;
  totalEntries: number;
  todayEntries: number;
  todayExits: number;
  conversionRatePct: number;
  entriesPerDay: Array<{ date: string; count: number }>;
  entryRatePerDay: Array<{ date: string; rate: number }>;
  exitRatePerDay: Array<{ date: string; rate: number }>;
  totalCapacity: number;
  totalOccupied: number;
  totalOccupiedPct: number;
  creationQueueCount: number;
  publicLink: string;
  recentActivity: {
    entries7d: number;
    clicks7d: number;
  };
}

export interface LaunchMessage {
  id: string;
  launchId: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'POLL';
  content: string;
  mediaUrl?: string | null;
  caption?: string | null;
  pollOptions?: string[] | null;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELED';
  targetGroups: 'ALL' | 'SPECIFIC';
  targetGroupIds?: string[];
  scheduledAt?: string | null;
  delayMinSeconds: number;
  delayMaxSeconds: number;
  createdAt: string;
  updatedAt?: string;
}

export interface LaunchScheduledGroupAction {
  id: string;
  launchId: string;
  type: 'CHANGE_NAME' | 'CHANGE_DESCRIPTION' | 'CHANGE_PHOTO' | 'LOCK_MESSAGES' | 'UNLOCK_MESSAGES';
  payload: string;
  scheduledAt: string;
  applyToFuture: boolean;
  applyToAllGroups: boolean;
  selectedGroupIds?: string[];
  status: 'SCHEDULED' | 'EXECUTED' | 'CANCELED';
  executedAt?: string;
  results?: Array<{ groupId: string; status: 'SUCCESS' | 'FAILED'; error?: string }>;
  createdAt: string;
}

export interface LaunchInboxMessage {
  id: string;
  launchId: string;
  participantPhone: string;
  participantName?: string;
  origin: 'GROUP' | 'PRIVATE';
  groupId?: string;
  messageText: string;
  status: 'PENDING' | 'SENT' | 'REJECTED' | 'IGNORED';
  suggestedReply?: string;
  confidencePercent?: number;
  isAutoReplied?: boolean;
  replyText?: string;
  receivedAt: string;
  repliedAt?: string;
}

export interface LaunchWebhook {
  id: string;
  launchId: string;
  name: string;
  url: string;
  events: string[];
  secretToken?: string;
  isActive: boolean;
  createdAt: string;
}

export interface LaunchWebhookDelivery {
  id: string;
  webhookId: string;
  launchId: string;
  event: string;
  status: number;
  occurredAt: string;
  payload: any;
}

export interface LaunchAnalytics {
  leads7d: number;
  entriesToday: number;
  exitsToday: number;
  conversionRatePct: number;
  hourlyFlow: Array<{ hour: string; count: number }>;
  utmSources: Array<{ source: string; count: number; pct: number }>;
  groupPerformance: Array<{ id: string; name: string; memberCount: number; maxMembers: number; occupancyPct: number; exitsCount: number }>;
}

export type LaunchDetailTab =
  | 'dashboard'
  | 'groups'
  | 'leads'
  | 'analytics'
  | 'inbox'
  | 'actions'
  | 'messages'
  | 'private'
  | 'integrations'
  | 'config';
