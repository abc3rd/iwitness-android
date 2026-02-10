-- ============================================================
-- SMART VIRAL AFFILIATE SCAN & SHARE SUPER-APP
-- Complete PostgreSQL Schema
-- UCrash + LegendaryLeads + UCP Fusion System
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- geospatial

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'client', 'attorney', 'medical_provider', 'affiliate',
  'admin', 'super_admin', 'tenant_owner'
);

CREATE TYPE lead_status AS ENUM (
  'new', 'contacted', 'qualified', 'proposal', 'negotiation',
  'won', 'lost', 'nurturing', 'disqualified'
);

CREATE TYPE case_status AS ENUM (
  'intake', 'review', 'active', 'pending_docs', 'in_litigation',
  'settlement', 'closed', 'archived'
);

CREATE TYPE event_type AS ENUM (
  'crash_detected', 'sudden_deceleration', 'medical_proximity',
  'accident_hotspot', 'legal_proximity', 'geofence_entry',
  'geofence_exit', 'nfc_tap', 'beacon_proximity', 'manual_report'
);

CREATE TYPE offer_source AS ENUM (
  'amazon', 'ebay', 'cj', 'impact', 'shareasale', 'custom'
);

CREATE TYPE notification_channel AS ENUM (
  'push', 'sms', 'email', 'whatsapp', 'in_app'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'processing', 'completed', 'failed', 'refunded', 'held'
);

CREATE TYPE qr_campaign_status AS ENUM (
  'draft', 'active', 'paused', 'expired', 'archived'
);

CREATE TYPE pipeline_stage AS ENUM (
  'prospect', 'contacted', 'qualified', 'proposal_sent',
  'negotiation', 'closed_won', 'closed_lost'
);

CREATE TYPE subscription_tier AS ENUM (
  'free', 'starter', 'professional', 'enterprise', 'white_label'
);

-- ============================================================
-- TENANTS (White-Label Multi-Tenancy)
-- ============================================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255),
  custom_domain VARCHAR(255),
  branding JSONB DEFAULT '{}',        -- logo, colors, fonts
  settings JSONB DEFAULT '{}',        -- feature flags, config
  subscription_tier subscription_tier DEFAULT 'free',
  is_active BOOLEAN DEFAULT true,
  encryption_key_id VARCHAR(255),     -- per-tenant encryption
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS & AUTH
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  phone VARCHAR(50),
  phone_verified BOOLEAN DEFAULT false,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  role user_role DEFAULT 'client',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR(255),
  webauthn_credentials JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- ROLES & PERMISSIONS (RBAC + ABAC)
-- ============================================================

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(100) NOT NULL,        -- e.g., 'leads', 'cases', 'analytics'
  action VARCHAR(50) NOT NULL,            -- e.g., 'read', 'write', 'delete', 'admin'
  conditions JSONB DEFAULT '{}',         -- ABAC conditions
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role NOT NULL,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission_id, tenant_id)
);

-- ============================================================
-- SESSIONS (Auth Sessions / Tokens)
-- ============================================================

CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255),
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id);

-- ============================================================
-- AFFILIATES
-- ============================================================

CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  affiliate_code VARCHAR(50) UNIQUE NOT NULL,
  referral_url TEXT NOT NULL,
  parent_affiliate_id UUID REFERENCES affiliates(id),  -- multi-level
  tier INTEGER DEFAULT 1,
  commission_rate DECIMAL(5,4) DEFAULT 0.1000,
  lifetime_earnings DECIMAL(12,2) DEFAULT 0.00,
  pending_balance DECIMAL(12,2) DEFAULT 0.00,
  total_referrals INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0.0000,
  is_active BOOLEAN DEFAULT true,
  payout_method VARCHAR(50),            -- 'stripe', 'paypal', 'bank'
  payout_details JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX idx_affiliates_parent ON affiliates(parent_affiliate_id);
CREATE INDEX idx_affiliates_user ON affiliates(user_id);

-- ============================================================
-- REFERRAL ATTRIBUTION TREE
-- ============================================================

CREATE TABLE referral_tree (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES affiliates(id) NOT NULL,
  referred_user_id UUID REFERENCES users(id) NOT NULL,
  depth INTEGER DEFAULT 1,                    -- level in the tree
  attribution_path UUID[] DEFAULT '{}',       -- full path from root
  source VARCHAR(100),                        -- 'qr', 'link', 'direct'
  campaign_id UUID,                           -- FK to qr_campaigns
  scan_location GEOGRAPHY(POINT, 4326),
  scan_metadata JSONB DEFAULT '{}',
  converted BOOLEAN DEFAULT false,
  conversion_value DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referral_tree_referrer ON referral_tree(referrer_id);
CREATE INDEX idx_referral_tree_referred ON referral_tree(referred_user_id);

-- ============================================================
-- QR CAMPAIGNS
-- ============================================================

CREATE TABLE qr_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID REFERENCES affiliates(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status qr_campaign_status DEFAULT 'draft',
  qr_data JSONB NOT NULL,                    -- QR config, styling, embedded data
  target_url TEXT NOT NULL,
  redirect_url TEXT,                          -- dynamic redirect
  total_scans INTEGER DEFAULT 0,
  unique_scans INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  geo_fence JSONB,                           -- geofence boundaries for activation
  tags TEXT[] DEFAULT '{}',
  branding JSONB DEFAULT '{}',               -- white-label QR styling
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qr_campaigns_affiliate ON qr_campaigns(affiliate_id);
CREATE INDEX idx_qr_campaigns_status ON qr_campaigns(status);

-- ============================================================
-- QR SCAN EVENTS
-- ============================================================

CREATE TABLE qr_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES qr_campaigns(id) NOT NULL,
  affiliate_id UUID REFERENCES affiliates(id) NOT NULL,
  scanned_by UUID REFERENCES users(id),      -- null if anonymous
  scan_location GEOGRAPHY(POINT, 4326),
  ip_address INET,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  referral_created BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qr_scans_campaign ON qr_scans(campaign_id);
CREATE INDEX idx_qr_scans_time ON qr_scans(created_at);

-- ============================================================
-- LEADS
-- ============================================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  affiliate_id UUID REFERENCES affiliates(id),
  assigned_to UUID REFERENCES users(id),
  source VARCHAR(100),                        -- 'qr_scan', 'web_form', 'event_trigger', 'referral', 'api'
  source_campaign_id UUID REFERENCES qr_campaigns(id),
  status lead_status DEFAULT 'new',
  score INTEGER DEFAULT 0,                    -- AI-computed lead score 0-100
  score_factors JSONB DEFAULT '{}',
  full_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  location GEOGRAPHY(POINT, 4326),
  address JSONB DEFAULT '{}',
  incident_type VARCHAR(100),                 -- 'auto_accident', 'workplace', 'medical', 'slip_fall'
  incident_date TIMESTAMPTZ,
  incident_description TEXT,
  intake_data JSONB DEFAULT '{}',             -- dynamic form data
  ai_summary TEXT,
  probability DECIMAL(5,4) DEFAULT 0.0000,   -- AI conversion probability
  estimated_value DECIMAL(12,2) DEFAULT 0.00,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_affiliate ON leads(affiliate_id);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_tenant ON leads(tenant_id);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_created ON leads(created_at);

-- ============================================================
-- CASES
-- ============================================================

CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id),
  external_id VARCHAR(100),                   -- plate, claim ID
  title VARCHAR(500) NOT NULL,
  status case_status DEFAULT 'intake',
  case_type VARCHAR(100),
  attorney_id UUID REFERENCES users(id),
  medical_provider_id UUID REFERENCES users(id),
  client_id UUID REFERENCES users(id),
  affiliate_id UUID REFERENCES affiliates(id),
  incident_date TIMESTAMPTZ,
  incident_location GEOGRAPHY(POINT, 4326),
  incident_address JSONB DEFAULT '{}',
  description TEXT,
  notes TEXT,
  documents JSONB DEFAULT '[]',               -- list of document refs
  timeline JSONB DEFAULT '[]',                -- case timeline events
  settlement_amount DECIMAL(12,2),
  attorney_fee DECIMAL(12,2),
  medical_costs DECIMAL(12,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_attorney ON cases(attorney_id);
CREATE INDEX idx_cases_client ON cases(client_id);
CREATE INDEX idx_cases_tenant ON cases(tenant_id);
CREATE INDEX idx_cases_lead ON cases(lead_id);

-- ============================================================
-- EVIDENCE (Enhanced from existing sessions)
-- ============================================================

CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  session_id UUID,                            -- legacy compat
  uploaded_by UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,                  -- 'license_plate', 'scene_photo', 'document', 'video', 'audio'
  file_url TEXT,
  file_key VARCHAR(500),                      -- S3/storage key
  file_size INTEGER,
  mime_type VARCHAR(100),
  ai_analysis JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evidence_case ON evidence(case_id);

-- ============================================================
-- SENSOR / PHYSICAL EVENTS (Crash Detection)
-- ============================================================

CREATE TABLE sensor_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  device_id VARCHAR(255),
  event_type event_type NOT NULL,
  severity DECIMAL(5,2) DEFAULT 0.00,         -- 0-100 severity score
  location GEOGRAPHY(POINT, 4326),
  altitude DECIMAL(10,2),
  speed DECIMAL(8,2),                         -- km/h at time of event
  accelerometer_data JSONB DEFAULT '{}',      -- x, y, z values
  gyroscope_data JSONB DEFAULT '{}',
  raw_sensor_data JSONB DEFAULT '{}',
  ai_classification VARCHAR(100),
  confidence DECIMAL(5,4),
  lead_generated BOOLEAN DEFAULT false,
  lead_id UUID REFERENCES leads(id),
  alert_sent BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sensor_events_user ON sensor_events(user_id);
CREATE INDEX idx_sensor_events_type ON sensor_events(event_type);
CREATE INDEX idx_sensor_events_time ON sensor_events(created_at);
CREATE INDEX idx_sensor_events_location ON sensor_events USING GIST(location);

-- ============================================================
-- LOCATION EVENTS (Geofencing)
-- ============================================================

CREATE TABLE geofences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,                  -- 'medical_center', 'legal_office', 'accident_hotspot', 'custom'
  boundary GEOGRAPHY(POLYGON, 4326) NOT NULL,
  center GEOGRAPHY(POINT, 4326),
  radius_meters DECIMAL(10,2),
  trigger_actions JSONB DEFAULT '[]',         -- actions to take on entry/exit
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_geofences_boundary ON geofences USING GIST(boundary);

CREATE TABLE location_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  geofence_id UUID REFERENCES geofences(id),
  event_type VARCHAR(20) NOT NULL,            -- 'enter', 'exit', 'dwell'
  location GEOGRAPHY(POINT, 4326),
  dwell_time_seconds INTEGER,
  actions_triggered JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_location_events_user ON location_events(user_id);
CREATE INDEX idx_location_events_geofence ON location_events(geofence_id);

-- ============================================================
-- AFFILIATE OFFER FEEDS
-- ============================================================

CREATE TABLE offer_feeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source offer_source NOT NULL,
  external_id VARCHAR(255),
  name VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  advertiser VARCHAR(255),
  commission_type VARCHAR(50),                -- 'cpa', 'cpc', 'cps', 'cpl'
  commission_value DECIMAL(12,4),
  commission_currency VARCHAR(10) DEFAULT 'USD',
  epc DECIMAL(10,4),                          -- earnings per click
  conversion_rate DECIMAL(5,4),
  deep_link TEXT,
  image_url TEXT,
  landing_url TEXT,
  geo_targets TEXT[] DEFAULT '{}',            -- country/region codes
  relevance_score DECIMAL(5,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offer_feeds_source ON offer_feeds(source);
CREATE INDEX idx_offer_feeds_category ON offer_feeds(category);
CREATE INDEX idx_offer_feeds_score ON offer_feeds(relevance_score DESC);

-- ============================================================
-- OFFER CLICKS & CONVERSIONS
-- ============================================================

CREATE TABLE offer_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID REFERENCES offer_feeds(id) NOT NULL,
  user_id UUID REFERENCES users(id),
  affiliate_id UUID REFERENCES affiliates(id),
  click_url TEXT,
  ip_address INET,
  user_agent TEXT,
  location GEOGRAPHY(POINT, 4326),
  converted BOOLEAN DEFAULT false,
  conversion_value DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offer_clicks_offer ON offer_clicks(offer_id);
CREATE INDEX idx_offer_clicks_affiliate ON offer_clicks(affiliate_id);

-- ============================================================
-- CRM PIPELINES (LegendaryLeads)
-- ============================================================

CREATE TABLE crm_pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  stages JSONB NOT NULL DEFAULT '[]',         -- ordered list of stage definitions
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID REFERENCES crm_pipelines(id) NOT NULL,
  lead_id UUID REFERENCES leads(id),
  case_id UUID REFERENCES cases(id),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  stage pipeline_stage DEFAULT 'prospect',
  title VARCHAR(500) NOT NULL,
  value DECIMAL(12,2) DEFAULT 0.00,
  probability DECIMAL(5,2) DEFAULT 0.00,
  assigned_to UUID REFERENCES users(id),
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  notes TEXT,
  expected_close_date DATE,
  actual_close_date DATE,
  tags TEXT[] DEFAULT '{}',
  ai_insights JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_deals_pipeline ON crm_deals(pipeline_id);
CREATE INDEX idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX idx_crm_deals_assigned ON crm_deals(assigned_to);

-- ============================================================
-- CRM ACTIVITIES (Tasks, Calls, Emails, etc.)
-- ============================================================

CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,                  -- 'call', 'email', 'sms', 'meeting', 'task', 'note', 'whatsapp'
  subject VARCHAR(500),
  body TEXT,
  status VARCHAR(50) DEFAULT 'pending',       -- 'pending', 'completed', 'cancelled'
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  outcome VARCHAR(100),                       -- 'connected', 'voicemail', 'no_answer', 'interested', 'not_interested'
  ai_generated BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crm_activities_deal ON crm_activities(deal_id);
CREATE INDEX idx_crm_activities_user ON crm_activities(user_id);
CREATE INDEX idx_crm_activities_scheduled ON crm_activities(scheduled_at);

-- ============================================================
-- AI EVENTS & VOICE COMMANDS
-- ============================================================

CREATE TABLE ai_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(100) NOT NULL,                 -- 'voice_command', 'prediction', 'auto_task', 'coaching'
  input_text TEXT,
  output_text TEXT,
  intent VARCHAR(100),                        -- parsed intent
  entities JSONB DEFAULT '{}',                -- extracted entities
  confidence DECIMAL(5,4),
  action_taken VARCHAR(255),
  result JSONB DEFAULT '{}',
  processing_time_ms INTEGER,
  model_version VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_events_user ON ai_events(user_id);
CREATE INDEX idx_ai_events_type ON ai_events(type);

-- ============================================================
-- MESSAGING
-- ============================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id),
  lead_id UUID REFERENCES leads(id),
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  channel notification_channel NOT NULL,
  direction VARCHAR(10) NOT NULL,             -- 'inbound', 'outbound'
  subject VARCHAR(500),
  body TEXT NOT NULL,
  template_id VARCHAR(100),
  external_id VARCHAR(255),                   -- provider message ID
  status VARCHAR(50) DEFAULT 'sent',          -- 'queued', 'sent', 'delivered', 'read', 'failed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_case ON messages(case_id);
CREATE INDEX idx_messages_lead ON messages(lead_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  channel notification_channel DEFAULT 'in_app',
  action_url TEXT,
  action_data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- ============================================================
-- FINANCIAL TRANSACTIONS
-- ============================================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id),
  affiliate_id UUID REFERENCES affiliates(id),
  type VARCHAR(50) NOT NULL,                  -- 'commission', 'subscription', 'payout', 'refund', 'escrow'
  status payment_status DEFAULT 'pending',
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  description TEXT,
  stripe_payment_id VARCHAR(255),
  stripe_payout_id VARCHAR(255),
  reference_type VARCHAR(50),                 -- 'lead', 'case', 'offer', 'subscription'
  reference_id UUID,
  metadata JSONB DEFAULT '{}',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_affiliate ON transactions(affiliate_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id) NOT NULL,
  tier subscription_tier DEFAULT 'free',
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active',        -- 'active', 'past_due', 'cancelled', 'trialing'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);

-- ============================================================
-- AUDIT LOG (Compliance)
-- ============================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID,
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_time ON audit_log(created_at);

-- ============================================================
-- ANALYTICS EVENTS
-- ============================================================

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID,
  user_id UUID,
  session_id VARCHAR(255),
  event_name VARCHAR(100) NOT NULL,
  event_category VARCHAR(100),
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  referrer TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_content VARCHAR(255),
  device_info JSONB DEFAULT '{}',
  location GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_time ON analytics_events(created_at);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at'
    AND table_schema = 'public'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- RPC: Get or Create Affiliate (backward compat)
-- ============================================================

CREATE OR REPLACE FUNCTION get_or_create_affiliate(p_email TEXT)
RETURNS TABLE(affiliate_id TEXT, referral_url TEXT, created_at TIMESTAMPTZ) AS $$
DECLARE
  v_user_id UUID;
  v_affiliate affiliates%ROWTYPE;
  v_handle TEXT;
  v_code TEXT;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE email = p_email;

  IF v_user_id IS NULL THEN
    INSERT INTO users (email, role)
    VALUES (p_email, 'affiliate')
    RETURNING id INTO v_user_id;
  END IF;

  SELECT * INTO v_affiliate FROM affiliates WHERE affiliates.user_id = v_user_id;

  IF v_affiliate.id IS NULL THEN
    v_handle := UPPER(REGEXP_REPLACE(SPLIT_PART(p_email, '@', 1), '[^A-Za-z0-9]', '', 'g'));
    v_code := 'UCRASH-' || v_handle;

    INSERT INTO affiliates (user_id, affiliate_code, referral_url)
    VALUES (
      v_user_id,
      v_code,
      'https://ucrash.claims/r/' || v_code
    )
    RETURNING * INTO v_affiliate;
  END IF;

  RETURN QUERY SELECT
    v_affiliate.affiliate_code,
    v_affiliate.referral_url,
    v_affiliate.created_at;
END;
$$ LANGUAGE plpgsql;
