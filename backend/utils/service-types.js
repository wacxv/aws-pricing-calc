/**
 * Constants for service types, to avoid hardcoded IDs throughout the application
 */
const ServiceTypes = {
    VOICE_VIDEO: 1,
    AMAZON_Q: 2,
    MESSAGING_CHAT: 3,
    EMAIL: 4,
    TASK: 5,
    CASE: 7,
    CUSTOMER_PROFILE: 8,
    GUIDES: 9,
    AGENT_ASSIST: 10,
    VOICE_ID: 11,  // Add this line
    ACS: 12,
    CONTACT_LENS: 13,
    FORECASTING_SCHEDULING: 14


};

/**
 * Service ID mapping to service types
 */
const serviceTypeMap = new Map([
  [1, ServiceTypes.VOICE_VIDEO],
  [2, ServiceTypes.AMAZON_Q],
  [3, ServiceTypes.MESSAGING_CHAT],
  [4, ServiceTypes.EMAIL],
  [5, ServiceTypes.TASK], 
  [7, ServiceTypes.CASE],
  [8, ServiceTypes.CUSTOMER_PROFILE]
]);

/**
 * Get service type by service ID
 */
function getServiceTypeById(serviceId) {
  return serviceTypeMap.get(parseInt(serviceId));
}

/**
 * Check if a service is of a specific type
 */
const isServiceType = (serviceId, type) => Number(serviceId) === type;

module.exports = {
  ServiceTypes,
  isServiceType
};
