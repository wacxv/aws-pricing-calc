export interface Service {
  service_id: number;
  service_name: string;
  service_description?: string;
  created_at?: Date;
  updated_at?: Date;
  call_type_id?: number;
  matchesCallType?: boolean;
}

export interface Region {
  region_id: number;
  region_name: string;
  region_code?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Country {
  country_id: number;
  country_name: string;
  country_code: string;
  region_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CallType {
  call_type_id: number;
  call_type_name: string;
  created_at?: Date;
  updated_at?: Date;
}

// Add the CollectionModel interface
export interface CollectionModel {
  collection_id: number;
  collection_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CalculationResult {
  id?: number;
  serviceId?: number;
  regionId?: number;
  regionName?: string;
  countryId?: number;
  countryCode?: string;
  countryName?: string;
  call_type_id?: number;
  businessDays?: number;
  aht?: number;
  dailyUsage?: number;
  monthlyUsage?: number;
  callMinutes?: number;
  cost_did?: number;
  cost_toll_free?: number;

  // Messaging and Chat costs
  cost_chat_usage?: number;
  cost_sms_usage?: number;
  cost_chat_experiences?: number;
  cost_apple_messages?: number;
  cost_whatsapp_messaging?: number;

  // Email costs
  cost_email_usage?: number;

  // Amazon Q costs
  cost_azq_chat_usage?: number;
  cost_azq_voice_usage?: number;

  // Task costs
  cost_task_usage?: number;

  // Case costs
  cost_case_usage?: number;

  // Connect Lens costs
  audio_analysis_minutes?: number;
  chat_analysis_interactions?: number;
  cost_audio_analysis?: number;
  cost_chat_analysis?: number;

  // Forecasting and Scheduling costs
  scheduled_agents?: number;
  cost_forecasting_scheduling?: number;

  // Connect Services costs with consistent naming
  cost_invoice_acs?: number;
  cost_outbound_acs?: number;
  cost_chat_usage_acs?: number;
  cost_email_acs?: number;
  cost_task_acs?: number;
  cost_sms_acs?: number;
  cost_apple_acs?: number;
  cost_whatsapp_acs?: number;
  cost_guide_acs?: number;
  cost_outcamp_acs?: number;

  // Connect Services inputs with consistent naming
  invoice_acs?: number;
  outbound_acs?: number;
  chat_usage_acs?: number;
  email_acs?: number;
  task_acs?: number;
  sms_acs?: number;
  apple_acs?: number;
  whatsapp_acs?: number;
  guide_acs?: number;
  outcamp_acs?: number;

  // Customer Profile costs
  cp_daily_azq?: number;
  cp_daily_azq_rate?: number;
  cost_cp_daily_azq?: number;
  cp_daily_ext?: number;
  cp_daily_ext_rate?: number;
  cost_cp_daily_ext?: number;

  // Guides costs
  msg_sent?: number;
  cost_msg_sent?: number;
  cost_guides_usage?: number;

  // Voice ID costs
  voiceid_usage?: number;
  cost_voiceid_usage?: number;

  // General properties
  serviceName?: string;
  total_cost: number;
  date_created?: Date;

  // Added fields for service and feature categories
  serviceCategoryId?: number;
  serviceCategoryName?: string;
  featureCategoryId?: number;
  featureCategoryName?: string;

  // Collection related fields
  calculation_id?: number;
  calculation_result_id?: number;
  collection_id?: number;
  collection_name?: string;

  // Add any other missing fields
  [key: string]: any; // Add index signature to allow string indexing
}
