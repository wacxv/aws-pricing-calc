const db = require('../config/db.config');

class CalculationModel {
  static async getPricingData(serviceId, countryId, callTypeId) {
    console.log('Looking up pricing data with:', { serviceId, countryId, callTypeId });
    
    // Check for null or undefined parameters
    if (!serviceId || !countryId || !callTypeId) {
      console.error('Missing required parameters:', { serviceId, countryId, callTypeId });
      return null;
    }
    
    try {
      // First try exact match
      const [rows] = await db.query(
        'SELECT * FROM calculation_logic_vv WHERE service_id = ? AND country_id = ? AND call_type_id = ?',
        [serviceId, countryId, callTypeId]
      );
      
      console.log('Query result for exact match:', rows.length, 'records found');
      
      if (rows && rows.length > 0) {
        return rows[0];
      }
      
      // If no exact match, try with just service_id and call_type_id
      console.log('No exact match, trying with service_id and call_type_id');
      const [fallbackRows1] = await db.query(
        'SELECT * FROM calculation_logic_vv WHERE service_id = ? AND call_type_id = ? LIMIT 1',
        [serviceId, callTypeId]
      );
      
      if (fallbackRows1 && fallbackRows1.length > 0) {
        console.log('Found fallback with service_id and call_type_id');
        return fallbackRows1[0];
      }
      
      // If still no match, try with just service_id
      console.log('No match with service_id and call_type_id, trying with just service_id');
      const [fallbackRows2] = await db.query(
        'SELECT * FROM calculation_logic_vv WHERE service_id = ? LIMIT 1',
        [serviceId]
      );
      
      if (fallbackRows2 && fallbackRows2.length > 0) {
        console.log('Found fallback with just service_id');
        return fallbackRows2[0];
      }
      
      // Last resort, get any record
      console.log('No specific matches found, looking for any record');
      const [anyRecord] = await db.query('SELECT * FROM calculation_logic_vv LIMIT 1');
      
      if (anyRecord && anyRecord.length > 0) {
        console.log('Using generic fallback record from database');
        return anyRecord[0];
      }
      
      // If no records found at all, return null instead of creating default
      console.log('No pricing records found in database');
      return null;
    } catch (error) {
      console.error('Database error when fetching pricing data:', error);
      throw error;
    }
  }

  static async getChatPricingData(serviceId) {
    console.log('Looking up chat pricing data for service:', serviceId);
    
    try {
      const [rows] = await db.query(
        'SELECT * FROM calculation_logic_mc WHERE service_id = ?',
        [serviceId]
      );
      
      if (rows && rows.length > 0) {
        console.log('Chat pricing data found:', rows[0]);
        return rows[0];
      }
      
      // Try any record as fallback
      const [anyRows] = await db.query('SELECT * FROM calculation_logic_mc LIMIT 1');
      
      if (anyRows && anyRows.length > 0) {
        console.log('Using fallback chat pricing data from database');
        return anyRows[0];
      }
      
      // Return null if no records found instead of creating default
      console.log('No chat pricing records found in database');
      return null;
    } catch (error) {
      console.error('Database error when fetching chat pricing data:', error);
      throw error;
    }
  }

  static async getEmailPricingData(serviceId) {
    console.log('Looking up email pricing data for service:', serviceId);
    
    try {
      const [rows] = await db.query(
        'SELECT * FROM calculation_logic_em WHERE service_id = ?',
        [serviceId]
      );
      
      if (rows && rows.length > 0) {
        console.log('Email pricing data found:', rows[0]);
        return rows[0];
      }
      
      // Try any record as fallback
      const [anyRows] = await db.query('SELECT * FROM calculation_logic_em LIMIT 1');
      
      if (anyRows && anyRows.length > 0) {
        console.log('Using fallback email pricing data');
        return anyRows[0];
      }
      
      // Return null if no records found instead of creating default
      console.log('No email pricing records found in database');
      return null;
    } catch (error) {
      console.error('Database error when fetching email pricing data:', error);
      throw error;
    }
  }

  static async getAmazonQPricingData(serviceId) {
    console.log('Looking up Amazon Q pricing data for service:', serviceId);
    
    try {
      const [rows] = await db.query(
        'SELECT * FROM calculation_logic_azq WHERE service_id = ?',
        [serviceId]
      );
      
      if (rows && rows.length > 0) {
        console.log('Amazon Q pricing data found:', rows[0]);
        return rows[0];
      }
      
      // Try any record as fallback
      const [anyRows] = await db.query('SELECT * FROM calculation_logic_azq LIMIT 1');
      
      if (anyRows && anyRows.length > 0) {
        console.log('Using fallback Amazon Q pricing data');
        return anyRows[0];
      }
      
      // Return null if no records found instead of creating default
      console.log('No Amazon Q pricing records found in database');
      return null;
    } catch (error) {
      console.error('Database error when fetching Amazon Q pricing data:', error);
      throw error;
    }
  }

  static async getCasePricingData(serviceId) {
    console.log('Looking up case pricing data for service:', serviceId);
    
    try {
      const [rows] = await db.query(
        'SELECT * FROM calculation_logic_cs WHERE service_id = ?',
        [serviceId]
      );
      
      if (rows && rows.length > 0) {
        console.log('Case pricing data found:', rows[0]);
        return rows[0];
      }
      
      // Try any record as fallback
      const [anyRows] = await db.query('SELECT * FROM calculation_logic_cs LIMIT 1');
      
      if (anyRows && anyRows.length > 0) {
        console.log('Using fallback case pricing data');
        return anyRows[0];
      }
      
      // Return null if no records found instead of creating default
      console.log('No case pricing records found in database');
      return null;
    } catch (error) {
      console.error('Database error when fetching case pricing data:', error);
      throw error;
    }
  }

  static async getCustomerProfilePricingData(serviceId) {
    console.log('Looking up customer profile pricing data for service ID:', serviceId);
    
    try {
      // First try to ensure the table exists with additional fields
      await db.query(`
        CREATE TABLE IF NOT EXISTS calculation_logic_cp (
          id INT AUTO_INCREMENT PRIMARY KEY,
          service_id INT NOT NULL,
          cp_daily_azq DECIMAL(10, 4) NOT NULL,
          cp_daily_ext DECIMAL(10, 4) NOT NULL,
          cp_daily_azq_base DECIMAL(10, 4) NULL,
          cp_daily_ext_base DECIMAL(10, 4) NULL,
          cp_additional_rate DECIMAL(10, 4) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Try with service_id first
      const [rows] = await db.query(
        'SELECT * FROM calculation_logic_cp WHERE service_id = ?',
        [serviceId]
      );
      
      if (rows && rows.length > 0) {
        console.log('Found Customer Profile pricing for service ID:', serviceId, rows[0]);
        return rows[0];
      }
      
      // If no record for this service ID, try any record
      console.log('No Customer Profile record for service ID:', serviceId, 'Looking for any record');
      const [anyRows] = await db.query('SELECT * FROM calculation_logic_cp LIMIT 1');
      
      if (anyRows && anyRows.length > 0) {
        console.log('Using fallback Customer Profile pricing:', anyRows[0]);
        return anyRows[0];
      }
      
      // If no records found, return null
      console.log('No Customer Profile pricing records found');
      return null;
    } catch (error) {
      console.error('Error fetching Customer Profile pricing:', error);
      return null;
    }
  }

  // Add method to calculate additional costs for Customer Profile
  static calculateAdditionalCost(usage, baseRate, additionalRate) {
    if (usage <= 0) return 0;
    const additionalUnits = Math.floor(usage / 100);
    return additionalUnits * additionalRate;
  }

  static async saveCalculationResult(data) {
    try {
      console.log('Saving calculation result with data:', data);
 // Get country information if calculation_logic_id exists
 let countryInfo = { country_code: null, country_name: null };
 if (data.calculation_logic_id) {
   const [countryData] = await db.query(`
     SELECT c.country_code, c.country_name 
     FROM calculation_logic_vv vv 
     JOIN country c ON vv.country_id = c.country_id 
     WHERE vv.id = ?`,
     [data.calculation_logic_id]
   );
   if (countryData && countryData.length > 0) {
     countryInfo = {
       country_code: countryData[0].country_code,
       country_name: countryData[0].country_name
     };
   }
 }
      const query = `
        INSERT INTO calculation_results (
          calculation_logic_id,
          calculation_logic_mc_id,
          calculation_logic_em_id,
          calculation_logic_azq_id,
          calculation_logic_cs_id,
          calculation_logic_cp_id,
          calculation_logic_gd_id,
          calculation_logic_tk_id,
          calculation_logic_aza_id,
          calculation_logic_acs_id,
          calculation_logic_cl_id,
          calculation_logic_vid_id,
          calculation_logic_fs_id,
          country_code,
          country_name,
          daily_usage,
          business_days,
          aht,
          chat_usage,
          sms_usage,
          apple_messages,
          whatsapp_messaging,
          chat_experiences,
          email_usage,
          chat_azq_usage,
          voice_azq_usage,
          case_usage,
          cp_daily_azq,
          cp_daily_ext,
          msg_sent,
          monthly_calls,
          call_minutes,
          task_usage,
          voiceid_usage,
          invoice_acs,
          outbound_acs,
          chat_usage_acs,
          email_acs,
          task_acs,
          sms_acs,
          apple_acs,
          whatsapp_acs,
          guide_acs,
          outcamp_acs,
          cl_voice_calls,  
          cl_chat_message,  
          cl_performance_eval,  
          cl_screen_rec,  
          cl_external_voice,  
          cl_external_connector,
          agent_forecasted,
          cost_voice_usage,
          cost_did,
          cost_toll_free,
          cost_in_app_web_audio,
          cost_screen_sharing,
          cost_video_connection,
          cost_chat_usage,
          cost_sms_usage,
          cost_apple_messages,
          cost_whatsapp_messaging,
          cost_chat_experiences,
          cost_email_usage,
          cost_azq_chat_usage,
          cost_azq_voice_usage,
          cost_case_usage,
          cost_cp_daily_azq,
          cost_cp_daily_ext,
          cost_msg_sent,
          cost_task_usage,
          cost_invoice_acs,
          cost_outbound_acs,
          cost_chat_usage_acs,
          cost_task_acs,
          cost_sms_acs,
          cost_apple_acs,
          cost_whatsapp_acs,
          cost_guide_acs,
          cost_outcamp_acs,
          cost_email_acs,
          agent_usage,
          cost_agent_usage,
          cost_voiceid_usage,
          cost_cl_voice_calls,  
          cost_cl_chat_message,  
          cost_cl_performance_eval,  
          cost_cl_screen_rec,  
          cost_cl_external_voice,  
          cost_cl_external_connector,
          cost_agent_forecasted,
          total_cost
        ) VALUES (${Array(91).fill('?').join(', ')})`;

    // Count columns and values after query is defined
    const columnCount = query.split('?').length - 1;
    console.log('Number of columns in query:', columnCount);
      const values = [
        data.calculation_logic_id || null,
        data.calculation_logic_mc_id || null,
        data.calculation_logic_em_id || null,
        data.calculation_logic_azq_id || null,
        data.calculation_logic_cs_id || null,
        data.calculation_logic_cp_id || null,
        data.calculation_logic_gd_id || null,
        data.calculation_logic_tk_id || null,
        data.calculation_logic_aza_id || null,
        data.calculation_logic_acs_id || null,
        data.calculation_logic_cl_id || null,
        data.calculation_logic_vid_id || null,
        data.calculation_logic_fs_id || null,
        countryInfo.country_code,
        countryInfo.country_name,
        data.daily_usage || null,
        data.business_days || null,
        data.aht || null,
        data.chat_usage || null,
        data.sms_usage || null,
        data.apple_messages || null,
        data.whatsapp_messaging || null,
        data.chat_experiences || null,
        data.email_usage || null,
        data.chat_azq_usage || null,
        data.voice_azq_usage || null,
        data.case_usage || null,
        data.cp_daily_azq || null,
        data.cp_daily_ext || null,
        data.msg_sent || null,
        data.monthly_calls || null,
        data.call_minutes || null,
        data.task_usage || null,
        data.voiceid_usage || null,
        data.invoice_acs || null,
        data.outbound_acs || null,
        data.chat_usage_acs || null,
        data.email_acs || null,
        data.task_acs || null,
        data.sms_acs || null,
        data.apple_acs || null,
        data.whatsapp_acs || null,
        data.guide_acs || null,
        data.outcamp_acs || null,
        data.cl_voice_calls || null,
        data.cl_chat_message || null,
        data.cl_performance_eval || null,
        data.cl_screen_rec || null,
        data.cl_external_voice || null,
        data.cl_external_connector || null,
        data.agent_forecasted || null,
        data.cost_voice_usage || null,
        data.cost_did || null,
        data.cost_toll_free || null,
        data.cost_in_app_web_audio || null,
        data.cost_screen_sharing || null,
        data.cost_video_connection || null,
        data.cost_chat_usage || null,
        data.cost_sms_usage || null,
        data.cost_apple_messages || null,
        data.cost_whatsapp_messaging || null,
        data.cost_chat_experiences || null,
        data.cost_email_usage || null,
        data.cost_azq_chat_usage || null,
        data.cost_azq_voice_usage || null,
        data.cost_case_usage || null,
        data.cost_cp_daily_azq || null,
        data.cost_cp_daily_ext || null,
        data.cost_msg_sent || null,
        data.cost_task_usage || null,
        data.cost_invoice_acs || null,
        data.cost_outbound_acs || null,
        data.cost_chat_usage_acs || null,
        data.cost_task_acs || null,
        data.cost_sms_acs || null,
        data.cost_apple_acs || null,
        data.cost_whatsapp_acs || null,
        data.cost_guide_acs || null,
        data.cost_outcamp_acs || null,
        data.cost_email_acs || null,
        data.agent_usage || null,
        data.cost_agent_usage || null,
        data.cost_voiceid_usage || null,
        data.cost_cl_voice_calls || null,
        data.cost_cl_chat_message || null,
        data.cost_cl_performance_eval || null,
        data.cost_cl_screen_rec || null,
        data.cost_cl_external_voice || null,
        data.cost_cl_external_connector || null,
        data.cost_agent_forecasted || null,

        data.total_cost || 0
      ];

    // Count values after array is defined
    const valueCount = values.length;
    console.log('Number of values:', valueCount);

    const [result] = await db.query(query, values);
    console.log('Saved calculation result:', result);
    return result.insertId;

  } catch (error) {
    console.error('Error saving calculation result:', error);
    throw error;
  }
  }

  static async getAllVoicePricing() {
    try {
      const [rows] = await db.query('SELECT * FROM calculation_logic_vv');
      return rows;
    } catch (error) {
      console.error('Error getting all voice pricing data:', error);
      throw error;
    }
  }

  static async getAllChatPricing() {
    try {
      const [rows] = await db.query('SELECT * FROM calculation_logic_mc');
      return rows;
    } catch (error) {
      console.error('Error getting all chat pricing data:', error);
      throw error;
    }
  }

  static async getAllEmailPricing() {
    try {
      const [rows] = await db.query('SELECT * FROM calculation_logic_em');
      return rows;
    } catch (error) {
      console.error('Error getting all email pricing data:', error);
      throw error;
    }
  }

  static async getAllAmazonQPricing() {
    try {
      const [rows] = await db.query('SELECT * FROM calculation_logic_azq');
      return rows;
    } catch (error) {
      console.error('Error getting all Amazon Q pricing data:', error);
      throw error;
    }
  }

  static async getAllCasePricing() {
    try {
      const [rows] = await db.query('SELECT * FROM calculation_logic_cs');
      return rows;
    } catch (error) {
      console.error('Error getting all case pricing data:', error);
      throw error;
    }
  }

  static async getAllCustomerProfilePricing() {
    try {
      const [rows] = await db.query('SELECT * FROM calculation_logic_cp');
      return rows;
    } catch (error) {
      console.error('Error getting all customer profile pricing data:', error);
      throw error;
    }
  }

  static async getAllTaskPricing() {
    try {
      const [rows] = await db.query('SELECT * FROM calculation_logic_tk');
      return rows;
    } catch (error) {
      console.error('Error getting all task pricing data:', error);
      throw error;
    }
  }

  static async getAllGuidesPricing() {
    try {
      const [rows] = await db.query('SELECT * FROM calculation_logic_gd');
      return rows;
    } catch (error) {
      console.error('Error getting all guides pricing data:', error);
      throw error;
    }
  }

  static async getGuidesPricingData(serviceId) {
    console.log('Looking up guides pricing data for service:', serviceId);
    
    try {
      // First try to ensure the table exists
      await db.query(`
        CREATE TABLE IF NOT EXISTS calculation_logic_gd (
          id INT AUTO_INCREMENT PRIMARY KEY,
          service_id INT NOT NULL,
          guides_message_rate DECIMAL(10, 4) DEFAULT 0.007,
          msg_sent DECIMAL(10, 4) DEFAULT 0.007,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // First check if any records exist in the table
      const [countCheck] = await db.query('SELECT COUNT(*) as count FROM calculation_logic_gd');
      
      // If no records exist, create a default record
      if (countCheck[0].count === 0) {
        console.log('No Guides pricing records found, creating default record for service ID:', serviceId);
        
        // Insert a default record for the requested service ID
        await db.query(
          'INSERT INTO calculation_logic_gd (service_id, guides_message_rate, msg_sent) VALUES (?, ?, ?)',
          [serviceId || 9, 0.007, 0.007] // Using 0.007 as default rate from provided file
        );
        
        console.log('Created default Guides pricing record for service ID:', serviceId || 9);
      }
      
      // Try with service_id first
      const [rows] = await db.query(
        'SELECT * FROM calculation_logic_gd WHERE service_id = ?',
        [serviceId]
      );
      
      if (rows && rows.length > 0) {
        // Make sure we have both field options available (guides_message_rate and msg_sent)
        if (!rows[0].guides_message_rate && rows[0].msg_sent) {
          rows[0].guides_message_rate = rows[0].msg_sent;
        } else if (!rows[0].msg_sent && rows[0].guides_message_rate) {
          rows[0].msg_sent = rows[0].guides_message_rate;
        } else if (!rows[0].msg_sent && !rows[0].guides_message_rate) {
          rows[0].guides_message_rate = 0.007;
          rows[0].msg_sent = 0.007;
        }
        
        console.log('Guides pricing data found:', rows[0]);
        return rows[0];
      }
      
      // Try any record as fallback
      const [anyRows] = await db.query('SELECT * FROM calculation_logic_gd LIMIT 1');
      
      if (anyRows && anyRows.length > 0) {
        // Ensure both rate fields are available
        if (!anyRows[0].guides_message_rate && anyRows[0].msg_sent) {
          anyRows[0].guides_message_rate = anyRows[0].msg_sent;
        } else if (!anyRows[0].msg_sent && anyRows[0].guides_message_rate) {
          anyRows[0].msg_sent = anyRows[0].guides_message_rate;
        } else if (!anyRows[0].msg_sent && !anyRows[0].guides_message_rate) {
          anyRows[0].guides_message_rate = 0.007;
          anyRows[0].msg_sent = 0.007;
        }
        
        console.log('Using fallback guides pricing data:', anyRows[0]);
        return anyRows[0];
      }
      
      // This should never happen since we ensure at least one record exists
      console.error('No guides pricing records found despite creating default record');
      return { id: null, service_id: serviceId, guides_message_rate: 0.007, msg_sent: 0.007 };
    } catch (error) {
      console.error('Database error when fetching guides pricing data:', error);
      throw error;
    }
  }

  static async getTaskPricingData(serviceId) {
    console.log('Looking up task pricing data for service:', serviceId);
    
    try {
      const [rows] = await db.query(
        'SELECT * FROM calculation_logic_tk WHERE service_id = ?',
        [serviceId]
      );
      
      if (rows && rows.length > 0) {
        console.log('Task pricing data found:', rows[0]);
        return rows[0];
      }
      
      // Try any record as fallback
      const [anyRows] = await db.query('SELECT * FROM calculation_logic_tk LIMIT 1');
      
      if (anyRows && anyRows.length > 0) {
        console.log('Using fallback task pricing data');
        return anyRows[0];
      }
      
      // Return null if no records found
      console.log('No task pricing records found in database');
      return null;
    } catch (error) {
      console.error('Database error when fetching task pricing data:', error);
      throw error;
    }
  }

  static async getAllCalculationResults() {
    try {
      const [rows] = await db.query('SELECT * FROM calculation_results ORDER BY id DESC LIMIT 100');
      return rows;
    } catch (error) {
      console.error('Error getting calculation results:', error);
      throw error;
    }
  }

  static async getAgentAssistPricingData(serviceId) {
    console.log('Looking up agent assist pricing data for service:', serviceId);
    
    try {
      const [rows] = await db.query(
        'SELECT * FROM calculation_logic_aza WHERE service_id = ?',
        [serviceId]
      );
      
      if (rows && rows.length > 0) {
        console.log('Agent Assist pricing data found:', rows[0]);
        return rows[0];
      }
      
      // Try any record as fallback
      const [anyRows] = await db.query('SELECT * FROM calculation_logic_aza LIMIT 1');
      
      if (anyRows && anyRows.length > 0) {
        console.log('Using fallback agent assist pricing data');
        return anyRows[0];
      }
      
      // Return null if no records found
      console.log('No agent assist pricing records found in database');
      return null;
    } catch (error) {
      console.error('Database error when fetching agent assist pricing data:', error);
      throw error;
    }
  }

  // Add this method inside the CalculationModel class
  static async getVoiceIdPricingData(serviceId) {
    console.log('Looking up voice id pricing data for service:', serviceId);
    
    try {
      const [rows] = await db.query(
        'SELECT * FROM calculation_logic_vid WHERE service_id = ?',
        [serviceId]
      );
      
      if (rows && rows.length > 0) {
        console.log('Voice ID pricing data found:', rows[0]);
        return rows[0];
      }
      
      // Try any record as fallback
      const [anyRows] = await db.query('SELECT * FROM calculation_logic_vid LIMIT 1');
      
      if (anyRows && anyRows.length > 0) {
        console.log('Using fallback voice id pricing data');
        return anyRows[0];
      }
      
      // Return null if no records found
      console.log('No voice id pricing records found in database');
      return null;
    } catch (error) {
      console.error('Database error when fetching voice id pricing data:', error);
      throw error;
    }
  }

  static async getAllVoiceIdPricing() {
    try {
      const [rows] = await db.query('SELECT * FROM calculation_logic_vid');
      return rows;
    } catch (error) {
      console.error('Error getting all voice id pricing data:', error);
      throw error;
    }
  }

  static async getACSPricingData(serviceId) {
    console.log('Looking up ACS pricing data for service:', serviceId);
    
    try {
      const [rows] = await db.query(
        'SELECT * FROM calculation_logic_acs WHERE service_id = ?',
        [serviceId]
      );
      
      if (rows && rows.length > 0) {
        console.log('ACS Pricing Data:', rows[0]);
        return rows[0];
      }
      
      // Try any record as fallback
      const [anyRows] = await db.query('SELECT * FROM calculation_logic_acs LIMIT 1');
      
      if (anyRows && anyRows.length > 0) {
        console.log('Using fallback ACS pricing data');
        return anyRows[0];
      }
      
      console.log('No ACS pricing records found in database');
      return null;
    } catch (error) {
      console.error('Database error when fetching ACS pricing data:', error);
      throw error;
    }
  }

  static async getAllACSPricing() {
    try {
      const [rows] = await db.query('SELECT * FROM calculation_logic_acs');
      return rows;
    } catch (error) {
      console.error('Error fetching ACS pricing:', error);
      throw error;
    }
  }

  static async createCollection(collectionName) {
    try {
      const [result] = await db.query(
        'INSERT INTO calculation_collections (collection_name) VALUES (?)',
        [collectionName]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  static async addToCollection(collectionId, calculationId) {
    try {
      await db.query(
        'INSERT INTO collection_items (collection_id, calculation_id) VALUES (?, ?)',
        [collectionId, calculationId]
      );
      return true;
    } catch (error) {
      console.error('Error adding calculation to collection:', error);
      throw error;
    }
  }

  static async getCollectionCalculations(collectionId) {
    try {
      const [rows] = await db.query(`
        SELECT cr.*, cc.collection_name 
        FROM calculation_results cr
        JOIN collection_items ci ON cr.id = ci.calculation_id
        JOIN calculation_collections cc ON ci.collection_id = cc.collection_id
        WHERE cc.collection_id = ?`,
        [collectionId]
      );
      return rows;
    } catch (error) {
      console.error('Error getting collection calculations:', error);
      throw error;
    }
  }

  static async getAllCollections() {
    try {
      const [rows] = await db.query('SELECT * FROM calculation_collections');
      return rows;
    } catch (error) {
      console.error('Error getting collections:', error);
      throw error;
    }
  }

  static async getCollectionById(id) {
    try {
      const [collection] = await db.query(
        'SELECT * FROM collections WHERE id = ?',
        [id]
      );
      return collection[0];
    } catch (error) {
      console.error('Error getting collection:', error);
      throw error;
    }
  }
  
  static async updateCollection(id, collection_name) {
    try {
      const [result] = await db.query(
        'UPDATE calculation_collections SET collection_name = ? WHERE collection_id = ?',
        [collection_name, id]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Collection not found');
      }
      
      return {
        collection_id: id,
        collection_name: collection_name
      };
    } catch (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
  }

  static async deleteCollection(id) {
    try {
      // Start a transaction
      await db.query('START TRANSACTION');
  
      try {
        // Get all calculation IDs in this collection
        const [calculationIds] = await db.query(
          'SELECT calculation_id FROM collection_items WHERE collection_id = ?',
          [id]
        );
  
        // Delete all calculations in the collection
        if (calculationIds.length > 0) {
          const ids = calculationIds.map(item => item.calculation_id);
          await db.query(
            'DELETE FROM calculation_results WHERE id IN (?)',
            [ids]
          );
        }
  
        // Delete collection items
        await db.query(
          'DELETE FROM collection_items WHERE collection_id = ?',
          [id]
        );
  
        // Delete the collection itself
        const [result] = await db.query(
          'DELETE FROM calculation_collections WHERE collection_id = ?',
          [id]
        );
  
        // Commit the transaction
        await db.query('COMMIT');
  
        return result.affectedRows > 0;
      } catch (error) {
        // Rollback in case of error
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }

  static async getCLPricingData(serviceId) {
    console.log('Looking up Contact Lens pricing data for service:', serviceId);
    
    try {
      const [rows] = await db.query(
        'SELECT * FROM calculation_logic_cl WHERE service_id = ?',
        [serviceId]
      );
      
      if (rows && rows.length > 0) {
        console.log('Contact Lens pricing data found:', rows[0]);
        return rows[0];
      }
      
      // Try any record as fallback
      const [anyRows] = await db.query('SELECT * FROM calculation_logic_cl LIMIT 1');
      
      if (anyRows && anyRows.length > 0) {
        console.log('Using fallback Contact Lens pricing data');
        return anyRows[0];
      }
      
      console.log('No Contact Lens pricing records found in database');
      return null;
    } catch (error) {
      console.error('Database error when fetching Contact Lens pricing data:', error);
      throw error;
    }
  }

  static async getAllCLPricing() {
    try {
      const [rows] = await db.query('SELECT * FROM calculation_logic_cl');
      return rows;
    } catch (error) {
      console.error('Error getting all Contact Lens pricing data:', error);
      throw error;
    }
  }

  static async getAllContactLensPricing() {
    try {
      const [rows] = await db.query('SELECT * FROM calculation_logic_cl');
      return rows;
    } catch (error) {
      console.error('Error getting all contact lens pricing data:', error);
      throw error;
    }
  }

  static async getAllForecastingPricing() {
    try {
      const [rows] = await db.query('SELECT * FROM calculation_logic_fs');
      return rows;
    } catch (error) {
      console.error('Error getting all forecasting pricing data:', error);
      throw error;
    }
  }

  static calculateCLVoiceCost(usage, baseRate, additionalRate) {
    if (usage <= 5000000) {
      return usage * baseRate;
    }
    return (5000000 * baseRate) + ((usage - 5000000) * additionalRate);
  }

  static calculateCLExternalVoiceCost(usage, additionalRate) {
    if (usage <= 2000000) {
      return 0;
    }
    return (usage - 2000000) * additionalRate;
  }

  static async getFSPricingData(serviceId) {
    console.log('Looking up Forecasting & Scheduling pricing data for service:', serviceId);
    
    try {
      const [rows] = await db.query(
        'SELECT * FROM calculation_logic_fs WHERE service_id = ?',
        [serviceId]
      );
      
      if (rows && rows.length > 0) {
        console.log('F&S pricing data found:', rows[0]);
        return rows[0];
      }
      
      // Try any record as fallback
      const [anyRows] = await db.query('SELECT * FROM calculation_logic_fs LIMIT 1');
      
      if (anyRows && anyRows.length > 0) {
        console.log('Using fallback F&S pricing data');
        return anyRows[0];
      }
      
      console.log('No F&S pricing records found in database');
      return null;
    } catch (error) {
      console.error('Database error when fetching F&S pricing data:', error);
      throw error;
    }
  }

  

  static async getCalculationResultById(id) {
    try {
      const [rows] = await db.query('SELECT * FROM calculation_results WHERE id = ?', [id]);
      
      if (rows && rows.length > 0) {
        console.log(`Found calculation result with ID ${id}`);
        return rows[0];
      }
      
      console.log(`No calculation result found with ID ${id}`);
      return null;
    } catch (error) {
      console.error(`Error getting calculation result with ID ${id}:`, error);
      throw error;
    }
  }

  static async updateCalculationResult(id, data) {
    try {
      // Convert data object to SET clause
      const setClause = Object.keys(data)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(data), id];
  
      // First update the record with proper SQL syntax
      const updateQuery = `UPDATE calculation_results SET ${setClause} WHERE id = ?`;
      
      console.log('Update Query:', updateQuery); // Debug log
      console.log('Values:', values); // Debug log
      
      await db.query(updateQuery, values);
  
      // Then fetch and return the updated record
      const [updated] = await db.query(
        'SELECT * FROM calculation_results WHERE id = ?',
        [id]
      );
  
      return updated[0];
    } catch (error) {
      console.error('Error updating calculation result:', error);
      throw error;
    }
  }
  static async deleteCalculationResult(id) {
    try {
      const deleteQuery = 'DELETE FROM calculation_results WHERE id = ?';
      await db.query(deleteQuery, [id]);
      return true;
    } catch (error) {
      console.error('Error deleting calculation result:', error);
      throw error;
    }
  }

}



module.exports = CalculationModel;