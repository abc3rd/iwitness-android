// ============================================================
// SHARED TYPE DEFINITIONS
// UCrash + LegendaryLeads + UCP Fusion System
// ============================================================

// -- User Roles --
export type UserRole =
  | 'client'
  | 'attorney'
  | 'medical_provider'
  | 'affiliate'
  | 'admin'
  | 'super_admin'
  | 'tenant_owner';

// -- Auth --
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  tenantId?: string;
  affiliateId?: string;
  referralUrl?: string;
  avatarUrl?: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// -- Tenant --
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  customDomain?: string;
  branding: TenantBranding;
  subscriptionTier: SubscriptionTier;
  isActive: boolean;
  createdAt: string;
}

export interface TenantBranding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  appName?: string;
}

export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise' | 'white_label';

// -- Lead --
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'nurturing'
  | 'disqualified';

export interface Lead {
  id: string;
  tenantId?: string;
  affiliateId?: string;
  assignedTo?: string;
  source: string;
  sourceCampaignId?: string;
  status: LeadStatus;
  score: number;
  scoreFactors: Record<string, number>;
  fullName: string;
  email: string;
  phone?: string;
  location?: GeoPoint;
  address?: Address;
  incidentType?: string;
  incidentDate?: string;
  incidentDescription?: string;
  intakeData: Record<string, unknown>;
  aiSummary?: string;
  probability: number;
  estimatedValue: number;
  tags: string[];
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// -- Case --
export type CaseStatus =
  | 'intake'
  | 'review'
  | 'active'
  | 'pending_docs'
  | 'in_litigation'
  | 'settlement'
  | 'closed'
  | 'archived';

export interface Case {
  id: string;
  tenantId?: string;
  leadId?: string;
  externalId?: string;
  title: string;
  status: CaseStatus;
  caseType?: string;
  attorneyId?: string;
  medicalProviderId?: string;
  clientId?: string;
  affiliateId?: string;
  incidentDate?: string;
  incidentLocation?: GeoPoint;
  incidentAddress?: Address;
  description?: string;
  notes?: string;
  documents: DocumentRef[];
  timeline: TimelineEvent[];
  settlementAmount?: number;
  attorneyFee?: number;
  medicalCosts?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRef {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface TimelineEvent {
  id: string;
  type: string;
  description: string;
  date: string;
  userId?: string;
}

// -- Evidence --
export interface Evidence {
  id: string;
  caseId?: string;
  sessionId?: string;
  uploadedBy?: string;
  type: string;
  fileUrl?: string;
  fileKey?: string;
  fileSize?: number;
  mimeType?: string;
  aiAnalysis: Record<string, unknown>;
  tags: string[];
  createdAt: string;
}

// -- Affiliate --
export interface Affiliate {
  id: string;
  userId: string;
  tenantId?: string;
  affiliateCode: string;
  referralUrl: string;
  parentAffiliateId?: string;
  tier: number;
  commissionRate: number;
  lifetimeEarnings: number;
  pendingBalance: number;
  totalReferrals: number;
  totalConversions: number;
  conversionRate: number;
  isActive: boolean;
  payoutMethod?: string;
  createdAt: string;
}

// -- QR Campaign --
export type QRCampaignStatus = 'draft' | 'active' | 'paused' | 'expired' | 'archived';

export interface QRCampaign {
  id: string;
  affiliateId: string;
  tenantId?: string;
  name: string;
  description?: string;
  status: QRCampaignStatus;
  qrData: QRCodeConfig;
  targetUrl: string;
  redirectUrl?: string;
  totalScans: number;
  uniqueScans: number;
  conversions: number;
  geoFence?: GeoFenceConfig;
  tags: string[];
  branding: Record<string, unknown>;
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QRCodeConfig {
  width: number;
  margin: number;
  color: { dark: string; light: string };
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  logoUrl?: string;
  style?: 'square' | 'rounded' | 'dots';
}

export interface QRScan {
  id: string;
  campaignId: string;
  affiliateId: string;
  scannedBy?: string;
  scanLocation?: GeoPoint;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo: Record<string, unknown>;
  referralCreated: boolean;
  createdAt: string;
}

// -- Sensor / Event Detection --
export type SensorEventType =
  | 'crash_detected'
  | 'sudden_deceleration'
  | 'medical_proximity'
  | 'accident_hotspot'
  | 'legal_proximity'
  | 'geofence_entry'
  | 'geofence_exit'
  | 'nfc_tap'
  | 'beacon_proximity'
  | 'manual_report';

export interface SensorEvent {
  id: string;
  userId?: string;
  deviceId?: string;
  eventType: SensorEventType;
  severity: number;
  location?: GeoPoint;
  altitude?: number;
  speed?: number;
  accelerometerData: { x: number; y: number; z: number };
  gyroscopeData: { x: number; y: number; z: number };
  aiClassification?: string;
  confidence?: number;
  leadGenerated: boolean;
  leadId?: string;
  alertSent: boolean;
  createdAt: string;
}

export interface GeoFenceConfig {
  type: 'circle' | 'polygon';
  center?: GeoPoint;
  radiusMeters?: number;
  points?: GeoPoint[];
}

// -- Affiliate Offers --
export type OfferSource = 'amazon' | 'ebay' | 'cj' | 'impact' | 'shareasale' | 'custom';

export interface AffiliateOffer {
  id: string;
  source: OfferSource;
  externalId?: string;
  name: string;
  description?: string;
  category?: string;
  advertiser?: string;
  commissionType: string;
  commissionValue: number;
  commissionCurrency: string;
  epc: number;
  conversionRate: number;
  deepLink?: string;
  imageUrl?: string;
  landingUrl?: string;
  geoTargets: string[];
  relevanceScore: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

// -- CRM Pipeline (LegendaryLeads) --
export type PipelineStage =
  | 'prospect'
  | 'contacted'
  | 'qualified'
  | 'proposal_sent'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export interface CRMPipeline {
  id: string;
  tenantId?: string;
  name: string;
  description?: string;
  stages: PipelineStageConfig[];
  isDefault: boolean;
  createdAt: string;
}

export interface PipelineStageConfig {
  key: PipelineStage;
  label: string;
  color: string;
  order: number;
}

export interface CRMDeal {
  id: string;
  pipelineId: string;
  leadId?: string;
  caseId?: string;
  tenantId?: string;
  stage: PipelineStage;
  title: string;
  value: number;
  probability: number;
  assignedTo?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  tags: string[];
  aiInsights: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CRMActivity {
  id: string;
  dealId?: string;
  leadId?: string;
  userId?: string;
  type: 'call' | 'email' | 'sms' | 'meeting' | 'task' | 'note' | 'whatsapp';
  subject?: string;
  body?: string;
  status: 'pending' | 'completed' | 'cancelled';
  scheduledAt?: string;
  completedAt?: string;
  durationSeconds?: number;
  outcome?: string;
  aiGenerated: boolean;
  createdAt: string;
}

// -- Voice Command --
export interface VoiceCommand {
  id: string;
  userId: string;
  inputText: string;
  intent: string;
  entities: Record<string, string>;
  confidence: number;
  actionTaken?: string;
  result: Record<string, unknown>;
  createdAt: string;
}

// -- Messaging --
export type NotificationChannel = 'push' | 'sms' | 'email' | 'whatsapp' | 'in_app';

export interface Message {
  id: string;
  caseId?: string;
  leadId?: string;
  senderId?: string;
  recipientId?: string;
  channel: NotificationChannel;
  direction: 'inbound' | 'outbound';
  subject?: string;
  body: string;
  status: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  channel: NotificationChannel;
  actionUrl?: string;
  actionData: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// -- Financial --
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'held';

export interface Transaction {
  id: string;
  tenantId?: string;
  userId?: string;
  affiliateId?: string;
  type: 'commission' | 'subscription' | 'payout' | 'refund' | 'escrow';
  status: PaymentStatus;
  amount: number;
  currency: string;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  processedAt?: string;
  createdAt: string;
}

// -- Analytics --
export interface AnalyticsEvent {
  eventName: string;
  eventCategory?: string;
  eventData: Record<string, unknown>;
  pageUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface AnalyticsSummary {
  totalLeads: number;
  newLeadsToday: number;
  conversionRate: number;
  totalRevenue: number;
  activeAffiliates: number;
  activeCampaigns: number;
  avgLeadScore: number;
  topSources: { source: string; count: number }[];
  leadsByStatus: { status: LeadStatus; count: number }[];
  revenueByDay: { date: string; amount: number }[];
  conversionFunnel: { stage: string; count: number }[];
}

export interface DashboardMetrics {
  leads: { total: number; new: number; converted: number; trend: number };
  revenue: { total: number; pending: number; trend: number };
  affiliates: { active: number; topPerformers: string[]; trend: number };
  cases: { open: number; closed: number; avgDuration: number; trend: number };
  campaigns: { active: number; totalScans: number; conversionRate: number };
}

// -- Geo Helpers --
export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

// -- API Response Wrappers --
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// -- Pagination --
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}
