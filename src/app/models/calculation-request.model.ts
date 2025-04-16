export interface CalculationRequest {
  service_id: number;
  country_id?: number;
  call_type_id?: number;
  
  // Voice service fields
  daily_usage?: number;
  business_days?: number;
  aht?: number;
  
  // Chat/Messaging service fields
  chat_usage?: number;
  sms_usage?: number;
  apple_messages?: number;
  whatsapp_messaging?: number;
  chat_experiences?: number;
  
  // Email service fields
  email_usage?: number;
  
  // Amazon Q fields
  chat_azq_usage?: number;
  voice_azq_usage?: number;
}
