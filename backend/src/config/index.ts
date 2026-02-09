// Backend Configuration
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',

  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/ucrash',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    },
  },

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'ucrash-dev-secret-change-in-production',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },

  // Twilio (SMS / WhatsApp)
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || '',
  },

  // Email (SMTP)
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@ucrash.claims',
  },

  // OpenAI (AI services)
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
  },

  // Firebase (Push notifications)
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '',
  },

  // Affiliate Networks
  affiliateNetworks: {
    amazon: {
      accessKey: process.env.AMAZON_ACCESS_KEY || '',
      secretKey: process.env.AMAZON_SECRET_KEY || '',
      associateTag: process.env.AMAZON_ASSOCIATE_TAG || '',
    },
    cj: {
      apiKey: process.env.CJ_API_KEY || '',
      websiteId: process.env.CJ_WEBSITE_ID || '',
    },
    impact: {
      accountSid: process.env.IMPACT_ACCOUNT_SID || '',
      authToken: process.env.IMPACT_AUTH_TOKEN || '',
    },
    shareasale: {
      apiToken: process.env.SHAREASALE_API_TOKEN || '',
      affiliateId: process.env.SHAREASALE_AFFILIATE_ID || '',
    },
  },

  // Analytics
  analytics: {
    ga4MeasurementId: process.env.GA4_MEASUREMENT_ID || '',
    ga4ApiSecret: process.env.GA4_API_SECRET || '',
  },

  // CORS
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:5173,https://ucrash.claims').split(','),
  },
} as const;
