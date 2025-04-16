/**
 * Interface for Voice Pricing data from the backend
 */
export interface VoicePricing {
  id?: number;
  service_id: number;
  country_id?: number;
  call_type_id?: number;
  voice_usage: number;
  DID_rate?: number;
  toll_free_rate?: number;
  in_app_web_audio?: number;
  screen_sharing?: number;
  video_connection?: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface for Chat Pricing data from the backend
 */
export interface ChatPricing {
  id?: number;
  service_id: number;
  chat_usage: number;
  sms_usage: number;
  apple_messages: number;
  whatsapp_messaging: number;
  chat_experiences: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface for Email Pricing data from the backend
 */
export interface EmailPricing {
  id?: number;
  service_id: number;
  email_usage: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface for Amazon Q Pricing data from the backend
 */
export interface AmazonQPricing {
  id?: number;
  service_id: number;
  chat_usage: number;
  voice_usage: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface for Task Pricing data from the backend
 */
export interface TaskPricing {
  id?: number;
  service_id: number;
  task_usage: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface for Case Pricing data from the backend
 */
export interface CasePricing {
  id?: number;
  service_id: number;
  case_usage: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface for Customer Profile Pricing data from the backend
 */
export interface CustomerProfilePricing {
  id?: number;
  service_id: number;
  cp_daily_azq: number;
  cp_daily_ext: number;
  cp_daily_azq_base?: number;
  cp_daily_ext_base?: number;
  cp_additional_rate?: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface for Guides Pricing data from the backend
 */
export interface GuidesPricing {
  id?: number;
  service_id: number;
  guides_message_rate: number;
  msg_sent?: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface for Voice ID Pricing data from the backend
 */
export interface VoiceIdPricing {
  id?: number;
  service_id: number;
  voiceid_usage: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface for Agent Assist Pricing data from the backend
 */
export interface AgentAssistPricing {
  id?: number;
  service_id: number;
  agent_usage: number;
  created_at?: Date;
  updated_at?: Date;
}
