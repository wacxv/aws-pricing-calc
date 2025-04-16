/**
 * Service IDs for different AWS services
 * These should match the IDs in your database
 */
export const SERVICE_IDS = {
  VOICE_VIDEO: 1,
  AMAZON_Q: 2,
  MESSAGING_CHAT: 3,
  EMAIL: 4,
  TASK: 5,
  CASE: 7,
  CUSTOMER_PROFILE: 8,
  GUIDES: 9,
  VOICE_ID: 11,
  AGENT_ASSIST: 10,
  CONNECT_SERVICES: 12,
  FORECASTING_SCHEDULING: 14,  // Changed from 12 to 14
  CONNECT_LENS: 13
};

/**
 * Service types that don't require region/country selection
 */
export const SERVICES_WITHOUT_REGION_COUNTRY = [
  SERVICE_IDS.AMAZON_Q,
  SERVICE_IDS.MESSAGING_CHAT,
  SERVICE_IDS.EMAIL,
  SERVICE_IDS.TASK,
  SERVICE_IDS.CASE,
  SERVICE_IDS.CUSTOMER_PROFILE,
  SERVICE_IDS.GUIDES,
  SERVICE_IDS.VOICE_ID,
  SERVICE_IDS.AGENT_ASSIST,
  SERVICE_IDS.CONNECT_LENS  // Make sure Connect Lens is here
];

/**
 * Default values for API requests
 */
export const API_DEFAULTS = {
  COUNTRY_ID: 1,
  REGION_ID: 1,
  CALL_TYPE_ID: 1
};

/**
 * Service categories for different AWS services
 */
export const SERVICE_CATEGORIES = {
  CONNECT: [
    SERVICE_IDS.VOICE_VIDEO,
    SERVICE_IDS.MESSAGING_CHAT,
    SERVICE_IDS.AMAZON_Q,
    SERVICE_IDS.CONNECT_SERVICES
  ],
  OMNICHANNEL: [
    SERVICE_IDS.VOICE_VIDEO,
    SERVICE_IDS.MESSAGING_CHAT,
    SERVICE_IDS.EMAIL,
    SERVICE_IDS.TASK,
    SERVICE_IDS.AMAZON_Q
  ],
  PRODUCTIVITY: [
    SERVICE_IDS.CASE,            // Case
    SERVICE_IDS.CUSTOMER_PROFILE, // Customer Profile
    SERVICE_IDS.VOICE_ID,        // Voice ID
    SERVICE_IDS.GUIDES,          // Guides
    SERVICE_IDS.AMAZON_Q         // Amazon Q
  ],
  ANALYTICS: [
    // Only include Connect Lens and Forecasting and Scheduling
    SERVICE_IDS.CONNECT_LENS,
    SERVICE_IDS.FORECASTING_SCHEDULING
  ] as number[],
  FEATURED: [
    SERVICE_IDS.CONNECT_SERVICES,  // Featured Amazon Connect Services
    SERVICE_IDS.VOICE_VIDEO,       // Core voice capabilities
    SERVICE_IDS.MESSAGING_CHAT     // Core messaging capabilities
  ]
};
