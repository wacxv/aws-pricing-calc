import { SERVICE_IDS } from '../config/service-constants';

/**
 * Constants for service types, to avoid hardcoded IDs throughout the application
 */
export enum ServiceTypes {
  VOICE_VIDEO = 'VOICE_VIDEO',
  AMAZON_Q = 'AMAZON_Q',
  MESSAGING_CHAT = 'MESSAGING_CHAT',
  EMAIL = 'EMAIL',
  TASK = 'TASK',
  CASE = 'CASE',
  CUSTOMER_PROFILE = 'CUSTOMER_PROFILE',
  GUIDES = 'GUIDES',
  VOICE_ID = 'VOICE_ID',
  CONNECT_LENS = 'CONNECT_LENS',
  FORECASTING_SCHEDULING = 'FORECASTING_SCHEDULING'
}

// Map service IDs to service types using constants from config
export const ServiceTypeMap: { [key: number]: ServiceTypes } = {
  [SERVICE_IDS.VOICE_VIDEO]: ServiceTypes.VOICE_VIDEO,
  [SERVICE_IDS.AMAZON_Q]: ServiceTypes.AMAZON_Q,
  [SERVICE_IDS.MESSAGING_CHAT]: ServiceTypes.MESSAGING_CHAT,
  [SERVICE_IDS.EMAIL]: ServiceTypes.EMAIL,
  [SERVICE_IDS.TASK]: ServiceTypes.TASK,
  [SERVICE_IDS.CASE]: ServiceTypes.CASE,
  [SERVICE_IDS.CUSTOMER_PROFILE]: ServiceTypes.CUSTOMER_PROFILE,
  [SERVICE_IDS.GUIDES]: ServiceTypes.GUIDES,
  [SERVICE_IDS.VOICE_ID]: ServiceTypes.VOICE_ID,
  [SERVICE_IDS.CONNECT_LENS]: ServiceTypes.CONNECT_LENS,
  [SERVICE_IDS.FORECASTING_SCHEDULING]: ServiceTypes.FORECASTING_SCHEDULING
};

// Get service type by ID
export const getServiceTypeById = (serviceId: number): ServiceTypes => {
  return ServiceTypeMap[serviceId] || ServiceTypes.VOICE_VIDEO;
};

// Check if service ID is of specific type
export const isServiceType = (serviceId: number, serviceType: ServiceTypes): boolean => {
  return getServiceTypeById(serviceId) === serviceType;
};

// Get all service IDs that match a specific type
export const getServiceIdsByType = (serviceType: ServiceTypes): number[] => {
  return Object.entries(ServiceTypeMap)
    .filter(([_, type]) => type === serviceType)
    .map(([id, _]) => Number(id));
};
