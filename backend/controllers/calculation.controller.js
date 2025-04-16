const CalculationModel = require('../models/calculation.model');
const CountryModel = require('../models/country.model'); 
const CallTypeModel = require('../models/call-type.model');
const ServiceModel = require('../models/service.model');
const { ServiceTypes, isServiceType } = require('../utils/service-types');
const db = require('../config/db.config');  // Add this line

exports.calculateCost = async (req, res) => {
  try {
    // Initialize response object at the start of the function
    let response = {
      total_cost: 0,
      daily_usage: 0,
      business_days: 0,
      aht: 0
    };

    console.log('Request received at /api/calculations with body:', req.body);
    
    // Handle both camelCase (frontend) and snake_case (backend) field names
    const { 
      service_id, serviceId,
      country_id, countryId,
      call_type_id, callTypeId,
      daily_usage, dailyUsage,
      business_days, businessDays,
      aht,
      chat_usage, chatUsage,
      sms_usage, smsUsage,
      apple_messages, appleMessages,
      whatsapp_messaging, whatsappMessaging,
      chat_experiences, chatExperiences,
      email_usage, emailUsage,
      // Amazon Q fields
      chat_azq_usage, chatAzqUsage,
      voice_azq_usage, voiceAzqUsage,
      task_usage, taskUsage,
      // Add case usage
      case_usage, caseUsage,
      // Add Customer Profile fields
      cp_daily_azq, cpDailyAzq,
      cp_daily_ext, cpDailyExt,
      // Update guides service field name
      msg_sent, msgSent, guides_messages_sent, guidesMessagesSent,
      // Add agent assist usage
      agent_assist_usage, agentAssistUsage
    } = req.body;

    // Use the variables with priority to snake_case (backend standard)
    const serviceIdToUse = parseInt(service_id || serviceId);
    const countryIdToUse = parseInt(country_id || countryId);
    const callTypeIdToUse = parseInt(call_type_id || callTypeId);
    
    console.log('Parsed IDs:', { serviceIdToUse, countryIdToUse, callTypeIdToUse });
    
    // Make sure we have valid IDs, but use defaults if missing
    if (!serviceIdToUse || !countryIdToUse || !callTypeIdToUse) {
      console.warn('Missing required parameters, using defaults:', { 
        serviceIdToUse: serviceIdToUse || 1, 
        countryIdToUse: countryIdToUse || 1, 
        callTypeIdToUse: callTypeIdToUse || 1 
      });
    }

    const dailyUsageToUse = daily_usage || dailyUsage;
    const businessDaysToUse = business_days || businessDays;
    const ahtToUse = aht;
    const chatUsageToUse = chat_usage || chatUsage;
    const smsUsageToUse = sms_usage || smsUsage;
    const appleMessagesToUse = apple_messages || appleMessages;
    const whatsappMessagingToUse = whatsapp_messaging || whatsappMessaging;
    const chatExperiencesToUse = chat_experiences || chatExperiences;
    const emailUsageToUse = parseInt(email_usage || emailUsage || 0);
    // Add these near other usage conversions
    const chatAzqUsageToUse = chat_azq_usage || chatAzqUsage;
    const voiceAzqUsageToUse = voice_azq_usage || voiceAzqUsage;
    const taskUsageToUse = task_usage || taskUsage;
    const caseUsageToUse = case_usage || caseUsage; // Add this line
    // More robust parsing for Customer Profile inputs - ensure we have numbers
    const cpDailyAzqToUse = Number(cp_daily_azq || cpDailyAzq || 0);
    const cpDailyExtToUse = Number(cp_daily_ext || cpDailyExt || 0);
    // Use priority: msg_sent, then msgSent, then guides_messages_sent, then guidesMessagesSent
    const msgSentToUse = Number(msg_sent || msgSent || guides_messages_sent || guidesMessagesSent || 0);
    // Add agent assist usage
    const agentAssistUsageToUse = Number(agent_assist_usage || agentAssistUsage || 0);

    // Log the received data for debugging
    console.log('Calculation request received:', {
      service_id: serviceIdToUse,
      country_id: countryIdToUse,
      call_type_id: callTypeIdToUse,
      daily_usage: dailyUsageToUse,
      business_days: businessDaysToUse,
      aht: ahtToUse
    });

    // Log the parsed input values for debugging
    console.log('Parsed Customer Profile input values:', {
      cpDailyAzqToUse,
      cpDailyExtToUse
    });

    // Fetch pricing data according to the service type
    let pricing;
    if (isServiceType(serviceIdToUse, ServiceTypes.AMAZON_Q)) {
      pricing = await CalculationModel.getAmazonQPricingData(serviceIdToUse);
      console.log('Amazon Q pricing data:', pricing);

      if (!pricing) {
        return res.status(404).json({ error: 'Amazon Q pricing data not found' });
      }

      // Calculate Amazon Q costs
      const azqChatRate = Number(pricing.chat_usage);
      const azqVoiceRate = Number(pricing.voice_usage);
      const chatAzqUsageToUse = Number(chat_azq_usage || chatAzqUsage) || 0;
      const voiceAzqUsageToUse = Number(voice_azq_usage || voiceAzqUsage) || 0;
      
      const cost_azq_chat_usage = chatAzqUsageToUse * azqChatRate;
      const cost_azq_voice_usage = voiceAzqUsageToUse * azqVoiceRate;
      const total_cost = parseFloat((cost_azq_chat_usage + cost_azq_voice_usage).toFixed(2));

      const saveData = {
        calculation_logic_azq_id: pricing.id,
        chat_azq_usage: chatAzqUsageToUse,
        voice_azq_usage: voiceAzqUsageToUse,
        cost_azq_chat_usage,
        cost_azq_voice_usage,
        total_cost
      };
      
      await CalculationModel.saveCalculationResult(saveData);
      return res.json({
        total_cost,
        cost_azq_chat_usage: parseFloat(cost_azq_chat_usage.toFixed(2)),
        cost_azq_voice_usage: parseFloat(cost_azq_voice_usage.toFixed(2))
      });
    } else if (isServiceType(serviceIdToUse, ServiceTypes.MESSAGING_CHAT)) {
      pricing = await CalculationModel.getChatPricingData(serviceIdToUse);
      console.log('Messaging and Chat pricing data:', pricing);

      if (!pricing) {
        return res.status(404).json({ error: 'Messaging and Chat pricing data not found' });
      }

      // Calculate costs
      const chatUsageRate = Number(pricing.chat_usage);
      const smsUsageRate = Number(pricing.sms_usage);
      const appleMessagesRate = Number(pricing.apple_messages);
      const whatsappMessagingRate = Number(pricing.whatsapp_messaging);
      const chatExperiencesRate = Number(pricing.chat_experiences);

      const chatUsageToUse = Number(chat_usage || chatUsage) || 0;
      const smsUsageToUse = Number(sms_usage || smsUsage) || 0;
      const appleMessagesToUse = Number(apple_messages || appleMessages) || 0;
      const whatsappMessagingToUse = Number(whatsapp_messaging || whatsappMessaging) || 0;
      const chatExperiencesToUse = Number(chat_experiences || chatExperiences) || 0;

      const cost_chat_usage = chatUsageToUse * chatUsageRate;
      const cost_sms_usage = smsUsageToUse * smsUsageRate;
      const cost_apple_messages = appleMessagesToUse * appleMessagesRate;
      const cost_whatsapp_messaging = whatsappMessagingToUse * whatsappMessagingRate;
      const cost_chat_experiences = chatExperiencesToUse * chatExperiencesRate;

      const total_cost = parseFloat((
        cost_chat_usage +
        cost_sms_usage +
        cost_apple_messages +
        cost_whatsapp_messaging +
        cost_chat_experiences
      ).toFixed(2));

      const saveData = {
        calculation_logic_mc_id: pricing.id,
        chat_usage: chatUsageToUse,
        sms_usage: smsUsageToUse,
        apple_messages: appleMessagesToUse,
        whatsapp_messaging: whatsappMessagingToUse,
        chat_experiences: chatExperiencesToUse,
        cost_chat_usage,
        cost_sms_usage,
        cost_apple_messages,
        cost_whatsapp_messaging,
        cost_chat_experiences,
        total_cost
      };
      
      await CalculationModel.saveCalculationResult(saveData);
      return res.json({
        total_cost,
        cost_chat_usage: parseFloat(cost_chat_usage.toFixed(2)),
        cost_sms_usage: parseFloat(cost_sms_usage.toFixed(2)),
        cost_apple_messages: parseFloat(cost_apple_messages.toFixed(2)),
        cost_whatsapp_messaging: parseFloat(cost_whatsapp_messaging.toFixed(2)),
        cost_chat_experiences: parseFloat(cost_chat_experiences.toFixed(2))
      });
    } else if (isServiceType(serviceIdToUse, ServiceTypes.EMAIL)) {
      pricing = await CalculationModel.getEmailPricingData(serviceIdToUse);
      console.log('Email pricing data:', pricing);

      if (!pricing) {
        return res.status(404).json({ error: 'Email pricing data not found' });
      }

      // Calculate email cost
      const emailUsageRate = Number(pricing.email_usage);
      const emailUsageToUse = Number(email_usage || emailUsage) || 0;
      const cost_email_usage = emailUsageToUse * emailUsageRate;
      const total_cost = parseFloat(cost_email_usage.toFixed(2));

      // Log the calculation
      console.log('Email calculation:', {
        usage: emailUsageToUse,
        rate: emailUsageRate,
        cost: cost_email_usage
      });

      const saveData = {
        calculation_logic_em_id: pricing.id,
        email_usage: emailUsageToUse,
        cost_email_usage,
        total_cost
      };
      
      await CalculationModel.saveCalculationResult(saveData);
      return res.json({
        total_cost,
        cost_email_usage: parseFloat(cost_email_usage.toFixed(2))
      });
    } else if (isServiceType(serviceIdToUse, ServiceTypes.TASK)) {
      pricing = await CalculationModel.getTaskPricingData(serviceIdToUse);
      console.log('Task pricing data:', pricing);

      if (!pricing) {
        return res.status(404).json({ error: 'Task pricing data not found' });
      }

      // Calculate task cost
      const taskUsageRate = Number(pricing.task_usage);
      const cost_task_usage = taskUsageToUse * taskUsageRate;
      const total_cost = parseFloat(cost_task_usage.toFixed(2));

      console.log('Task calculation details:', {
        taskUsageToUse,
        taskUsageRate,
        cost_task_usage,
        total_cost
      });

      // Prepare data for saving
      const saveData = {
        calculation_logic_tk_id: pricing.id,
        task_usage: taskUsageToUse,
        cost_task_usage: parseFloat(cost_task_usage.toFixed(2)),
        total_cost: parseFloat(total_cost.toFixed(2))
      };

      // Save calculation result
      await CalculationModel.saveCalculationResult(saveData);

      // Return response
      return res.json({
        task_usage: taskUsageToUse,
        cost_task_usage: parseFloat(cost_task_usage.toFixed(2)),
        total_cost: parseFloat(total_cost.toFixed(2))
      });
    } else if (isServiceType(serviceIdToUse, ServiceTypes.CASE)) {
      pricing = await CalculationModel.getCasePricingData(serviceIdToUse);
      console.log('Case pricing data:', pricing);

      if (!pricing) {
        return res.status(404).json({ error: 'Case pricing data not found' });
      }

      // Calculate case cost
      const caseUsageRate = Number(pricing.case_usage);
      const caseUsageToUse = Number(case_usage || caseUsage) || 0;
      const cost_case_usage = caseUsageToUse * caseUsageRate;
      const total_cost = parseFloat(cost_case_usage.toFixed(2));

      // Log the calculation
      console.log('Case calculation:', {
        usage: caseUsageToUse,
        rate: caseUsageRate,
        cost: cost_case_usage
      });

      const saveData = {
        calculation_logic_cs_id: pricing.id,
        case_usage: caseUsageToUse,
        cost_case_usage,
        total_cost
      };
      
      await CalculationModel.saveCalculationResult(saveData);
      return res.json({
        total_cost,
        cost_case_usage: parseFloat(cost_case_usage.toFixed(2))
      });
    } else if (isServiceType(serviceIdToUse, ServiceTypes.CUSTOMER_PROFILE)) {
      pricing = await CalculationModel.getCustomerProfilePricingData(serviceIdToUse);
      console.log('Customer Profile pricing data:', pricing);
      
      if (!pricing) {
        return res.status(404).json({ error: 'Customer Profile pricing data not found' });
      }
    
      // Get base rates and additional rate from pricing data
      const azqBaseRate = Number(pricing.cp_daily_azq_base || 0);
      const extBaseRate = Number(pricing.cp_daily_ext_base || 0);
      const additionalRate = Number(pricing.cp_additional_rate || 0);
      
      const cpDailyAzqToUse = Number(cp_daily_azq || cpDailyAzq) || 0;
      const cpDailyExtToUse = Number(cp_daily_ext || cpDailyExt) || 0;
    
      // Calculate costs for daily ext
      let cost_cp_daily_ext = cpDailyExtToUse * extBaseRate; // Base calculation (0.005 per unit)
      
      // Add additional rate for every 100 units
      if (cpDailyExtToUse > 100) {
        const additionalHundreds = Math.floor(cpDailyExtToUse / 100);
        cost_cp_daily_ext += (additionalHundreds * additionalRate);
      }
    
      // Calculate costs for daily azq (same logic)
      let cost_cp_daily_azq = cpDailyAzqToUse * azqBaseRate; // Base calculation
      
      if (cpDailyAzqToUse > 100) {
        const additionalHundreds = Math.floor(cpDailyAzqToUse / 100);
        cost_cp_daily_azq += (additionalHundreds * additionalRate);
      }
    
      const total_cost = parseFloat((cost_cp_daily_azq + cost_cp_daily_ext).toFixed(2));
    
      // Log calculations
      console.log('Customer Profile calculation:', {
        dailyExt: {
          usage: cpDailyExtToUse,
          baseRate: extBaseRate,
          additionalHundreds: Math.floor(cpDailyExtToUse / 100),
          additionalRate,
          totalCost: cost_cp_daily_ext
        },
        dailyAzq: {
          usage: cpDailyAzqToUse,
          baseRate: azqBaseRate,
          additionalHundreds: Math.floor(cpDailyAzqToUse / 100),
          additionalRate,
          totalCost: cost_cp_daily_azq
        }
      });

      const saveData = {
        calculation_logic_cp_id: pricing.id,
        cp_daily_azq: cpDailyAzqToUse,
        cp_daily_ext: cpDailyExtToUse,
        cost_cp_daily_azq,
        cost_cp_daily_ext,
        total_cost
      };
      
      await CalculationModel.saveCalculationResult(saveData);
      return res.json({
        total_cost,
        cost_cp_daily_azq: parseFloat(cost_cp_daily_azq.toFixed(2)),
        cost_cp_daily_ext: parseFloat(cost_cp_daily_ext.toFixed(2))
      });
    } else if (isServiceType(serviceIdToUse, ServiceTypes.GUIDES)) {
      pricing = await CalculationModel.getGuidesPricingData(serviceIdToUse);
      console.log('Guides pricing data:', pricing);
      
      if (!pricing) {
        return res.status(404).json({ error: 'Guides pricing data not found' });
      }
    
      // Calculate guides cost
      const guidesMessageRate = Number(pricing.guides_message_rate || 0);
      const msgSentToUse = Number(msg_sent || msgSent || guides_messages_sent || guidesMessagesSent) || 0;
      const cost_msg_sent = msgSentToUse * guidesMessageRate;
      const total_cost = parseFloat(cost_msg_sent.toFixed(2));
    
      // Log the calculation
      console.log('Guides calculation:', {
        msgSent: msgSentToUse,
        rate: guidesMessageRate,
        cost: cost_msg_sent
      });

      const saveData = {
        calculation_logic_gd_id: pricing.id,
        msg_sent: msgSentToUse,
        cost_msg_sent,
        total_cost
      };
      
      await CalculationModel.saveCalculationResult(saveData);
      return res.json({
        total_cost,
        cost_msg_sent: parseFloat(cost_msg_sent.toFixed(2))
      });
    } else if (isServiceType(serviceIdToUse, ServiceTypes.AGENT_ASSIST)) {
      const pricing = await CalculationModel.getAgentAssistPricingData(serviceIdToUse);
      if (!pricing) {
        throw new Error('Agent Assist pricing data not found');
      }
    
      // Log the incoming request data first for debugging
      console.log('req.body.agent_usage (raw):', req.body.agent_usage);
      
      // Parse and validate the usage value
      const agentUsageToUse = Number(req.body.agent_usage || 0);
      
      // Calculate agent assist cost
      const agentRate = Number(pricing.agent_usage);
      const cost_agent_usage = parseFloat((agentUsageToUse * agentRate).toFixed(2));
      
      // Total cost is the same as agent usage cost in this case
      const total_cost = cost_agent_usage;
    
      // Log the calculation
      console.log('Agent Assist calculation:', {
        usage: agentUsageToUse,
        rate: agentRate,
        cost: cost_agent_usage
      });
    
      const saveData = {
        calculation_logic_aza_id: pricing.id,
        agent_usage: agentUsageToUse, // Save the parsed number, not the raw input
        cost_agent_usage,
        total_cost
      };
      
      await CalculationModel.saveCalculationResult(saveData);
    
      // Return only the required fields
      return res.json({
        total_cost,
        cost_agent_usage
      });
    } else if (isServiceType(serviceIdToUse, ServiceTypes.VOICE_ID)) {
      pricing = await CalculationModel.getVoiceIdPricingData(serviceIdToUse);
      console.log('Voice ID pricing data:', pricing);
      
      if (!pricing) {
        return res.status(404).json({ error: 'Voice ID pricing data not found' });
      }
    
      // Calculate voice id cost
      const voiceidRate = Number(pricing.voiceid_usage);
      const voiceidUsageToUse = Number(req.body.voiceid_usage || 0);
      const cost_voiceid_usage = voiceidUsageToUse * voiceidRate;
      const total_cost = parseFloat(cost_voiceid_usage.toFixed(2));
    
      // Log the calculation
      console.log('Voice ID calculation:', {
        usage: voiceidUsageToUse,
        rate: voiceidRate,
        cost: cost_voiceid_usage
      });

      const saveData = {
        calculation_logic_vid_id: pricing.id,
        voiceid_usage: voiceidUsageToUse,
        cost_voiceid_usage,
        total_cost
      };
      
      await CalculationModel.saveCalculationResult(saveData);
      return res.json({
        total_cost,
        cost_voiceid_usage: parseFloat(cost_voiceid_usage.toFixed(2))
      });
    } else if (isServiceType(serviceIdToUse, ServiceTypes.ACS)) {
      pricing = await CalculationModel.getACSPricingData(serviceIdToUse);
      console.log('ACS pricing data:', pricing);

      if (!pricing) {
        return res.status(404).json({ error: 'ACS pricing data not found' });
      }

      // Parse input values
      const invoice_acs = Number(req.body.invoice_acs) || 0;
      const outbound_acs = Number(req.body.outbound_acs) || 0;
      const chat_usage_acs = Number(req.body.chat_usage_acs) || 0;
      const email_acs = Number(req.body.email_acs) || 0;
      const task_acs = Number(req.body.task_acs) || 0;
      const sms_acs = Number(req.body.sms_acs) || 0;
      const apple_acs = Number(req.body.apple_acs) || 0;
      const whatsapp_acs = Number(req.body.whatsapp_acs) || 0;
      const guide_acs = Number(req.body.guide_acs) || 0;
      const outcamp_acs = Number(req.body.outcamp_acs) || 0;

      // Calculate costs
      const cost_invoice_acs = invoice_acs * Number(pricing.invoice_acs);
      const cost_outbound_acs = outbound_acs * Number(pricing.outbound_acs);
      const cost_chat_usage_acs = chat_usage_acs * Number(pricing.chat_usage_acs);
      const cost_email_acs = email_acs * Number(pricing.email_acs);
      const cost_task_acs = task_acs * Number(pricing.task_acs);
      const cost_sms_acs = sms_acs * Number(pricing.sms_acs);
      const cost_apple_acs = apple_acs * Number(pricing.apple_acs);
      const cost_whatsapp_acs = whatsapp_acs * Number(pricing.whatsapp_acs);
      const cost_guide_acs = guide_acs * Number(pricing.guide_acs);
      const cost_outcamp_acs = outcamp_acs * Number(pricing.outcamp_acs);

      // Calculate total cost
      const total_cost = parseFloat((
        cost_invoice_acs +
        cost_outbound_acs +
        cost_chat_usage_acs +
        cost_email_acs +
        cost_task_acs +
        cost_sms_acs +
        cost_apple_acs +
        cost_whatsapp_acs +
        cost_guide_acs +
        cost_outcamp_acs
      ).toFixed(2));

      // Save calculation result
      await CalculationModel.saveCalculationResult({
        calculation_logic_acs_id: pricing.id,
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
        cost_invoice_acs,
        cost_outbound_acs,
        cost_chat_usage_acs,
        cost_email_acs,
        cost_task_acs,
        cost_sms_acs,
        cost_apple_acs,
        cost_whatsapp_acs,
        cost_guide_acs,
        cost_outcamp_acs,
        total_cost
      });

      // Return response
      return res.json({
        cost_invoice_acs: parseFloat(cost_invoice_acs.toFixed(2)),
        cost_outbound_acs: parseFloat(cost_outbound_acs.toFixed(2)),
        cost_chat_usage_acs: parseFloat(cost_chat_usage_acs.toFixed(2)),
        cost_email_acs: parseFloat(cost_email_acs.toFixed(2)),
        cost_task_acs: parseFloat(cost_task_acs.toFixed(2)),
        cost_sms_acs: parseFloat(cost_sms_acs.toFixed(2)),
        cost_apple_acs: parseFloat(cost_apple_acs.toFixed(2)),
        cost_whatsapp_acs: parseFloat(cost_whatsapp_acs.toFixed(2)),
        cost_guide_acs: parseFloat(cost_guide_acs.toFixed(2)),
        cost_outcamp_acs: parseFloat(cost_outcamp_acs.toFixed(2)),
        total_cost
      });
    } else if (isServiceType(serviceIdToUse, ServiceTypes.CONTACT_LENS)) {
      pricing = await CalculationModel.getCLPricingData(serviceIdToUse);
      console.log('Contact Lens pricing data:', pricing);

      if (!pricing) {
        return res.status(404).json({ error: 'Contact Lens pricing data not found' });
      }

      // Parse input values
      const cl_voice_calls = Number(req.body.cl_voice_calls) || 0;
      const cl_chat_message = Number(req.body.cl_chat_message) || 0;
      const cl_performance_eval = Number(req.body.cl_performance_eval) || 0;
      const cl_screen_rec = Number(req.body.cl_screen_rec) || 0;
      const cl_external_voice = Number(req.body.cl_external_voice) || 0;
      const cl_external_connector = Number(req.body.cl_external_connector) || 0;

      // Calculate voice calls cost with tiered pricing
      let cost_cl_voice_calls = 0;
      if (cl_voice_calls <= 5000000) {
        cost_cl_voice_calls = cl_voice_calls * Number(pricing.cl_voice_calls_base);
      } else {
        cost_cl_voice_calls = (5000000 * Number(pricing.cl_voice_calls_base)) + 
                             ((cl_voice_calls - 5000000) * Number(pricing.cl_voice_calls_additional_rate));
      }

      // Calculate external voice cost with tiered pricing
      let cost_cl_external_voice = 0;
      if (cl_external_voice > 2000000) {
        cost_cl_external_voice = (cl_external_voice - 2000000) * Number(pricing.cl_external_voice_additional_rate);
      }

      // Calculate other costs
      const cost_cl_chat_message = cl_chat_message * Number(pricing.cl_chat_message_usage);
      const cost_cl_performance_eval = cl_performance_eval * Number(pricing.cl_performance_evaluation);
      const cost_cl_screen_rec = cl_screen_rec * Number(pricing.cl_screen_recording);
      const cost_cl_external_connector = cl_external_connector * Number(pricing.cl_external_voice_connector);

      // Calculate total cost
      const total_cost = parseFloat((
        cost_cl_voice_calls +
        cost_cl_chat_message +
        cost_cl_performance_eval +
        cost_cl_screen_rec +
        cost_cl_external_voice +
        cost_cl_external_connector
      ).toFixed(2));

      // Save calculation result
      const saveData = {
        calculation_logic_cl_id: pricing.id,
        cl_voice_calls,
        cl_chat_message,
        cl_performance_eval,
        cl_screen_rec,
        cl_external_voice,
        cl_external_connector,
        cost_cl_voice_calls,
        cost_cl_chat_message,
        cost_cl_performance_eval,
        cost_cl_screen_rec,
        cost_cl_external_voice,
        cost_cl_external_connector,
        total_cost
      };

      await CalculationModel.saveCalculationResult(saveData);

      return res.json({
        cost_cl_voice_calls: parseFloat(cost_cl_voice_calls.toFixed(2)),
        cost_cl_chat_message: parseFloat(cost_cl_chat_message.toFixed(2)),
        cost_cl_performance_eval: parseFloat(cost_cl_performance_eval.toFixed(2)),
        cost_cl_screen_rec: parseFloat(cost_cl_screen_rec.toFixed(2)),
        cost_cl_external_voice: parseFloat(cost_cl_external_voice.toFixed(2)),
        cost_cl_external_connector: parseFloat(cost_cl_external_connector.toFixed(2)),
        total_cost
      });
    } else if (isServiceType(serviceIdToUse, ServiceTypes.FORECASTING_SCHEDULING)) {
      pricing = await CalculationModel.getFSPricingData(serviceIdToUse);
      console.log('F&S pricing data:', pricing);

      if (!pricing) {
        return res.status(404).json({ error: 'F&S pricing data not found' });
      }

      // Parse input values
      const agent_forecasted = Number(req.body.agent_forecasted) || 0;

      // Calculate costs
      const cost_agent_forecasted = agent_forecasted * Number(pricing.agent_forecasted);
      const total_cost = parseFloat(cost_agent_forecasted.toFixed(2));

      // Save calculation result
      const saveData = {
        calculation_logic_fs_id: pricing.id,
        agent_forecasted,
        cost_agent_forecasted: parseFloat(cost_agent_forecasted.toFixed(2)),
        total_cost
      };

      await CalculationModel.saveCalculationResult(saveData);

      return res.json({
        cost_agent_forecasted: parseFloat(cost_agent_forecasted.toFixed(2)),
        total_cost
      });
    } else {
      pricing = await CalculationModel.getPricingData(serviceIdToUse, countryIdToUse, callTypeIdToUse);
      console.log('Voice/Video pricing data:', pricing);
    }

    if (!pricing) {
      console.error('No pricing data found for service ID:', serviceIdToUse);
      return res.status(404).json({ error: 'Pricing data not found. Please ensure pricing information is available in the database.' });
    }

    // Extract pricing rates from the database pricing data - avoid hardcoded defaults
    const { 
      voice_usage, 
      DID_rate, 
      toll_free_rate, 
      in_app_web_audio, 
      screen_sharing, 
      video_connection, 
      chat_usage: chatUsageRate, 
      sms_usage: smsUsageRate, 
      apple_messages: appleMessagesRate, 
      whatsapp_messaging: whatsappMessagingRate, 
      chat_experiences: chatExperiencesRate, 
      email_usage: emailUsageRate,
      case_usage: caseUsageRate
      // Remove Customer Profile rates from destructuring since we'll define them explicitly below
    } = pricing || {};
    
    // Amazon Q specific rates from database
    const azqChatRate = isServiceType(serviceIdToUse, ServiceTypes.AMAZON_Q) ? pricing.chat_usage : 0;
    const azqVoiceRate = isServiceType(serviceIdToUse, ServiceTypes.AMAZON_Q) ? pricing.voice_usage : 0;

    // Ensure that the pricing values are correctly retrieved from the database
    const cpDailyAzqRate = isServiceType(serviceIdToUse, ServiceTypes.CUSTOMER_PROFILE) ? 
                          Number(pricing.cp_daily_azq || 0) : 0;
    const cpDailyExtRate = isServiceType(serviceIdToUse, ServiceTypes.CUSTOMER_PROFILE) ? 
                          Number(pricing.cp_daily_ext || 0) : 0;

    // Extract Guides rate from pricing without hardcoded fallback
    const guidesMessageRate = isServiceType(serviceIdToUse, ServiceTypes.GUIDES) ? 
                             pricing.guides_message_rate : 0;

    // First, add taskUsageRate extraction with the other rate declarations
    const taskUsageRate = isServiceType(serviceIdToUse, ServiceTypes.TASK) ? 
                         Number(pricing.task_usage) : 0;

    console.log('Customer Profile rates used in calculation:', {
      cpDailyAzqRate,
      cpDailyExtRate
    });

    console.log('Pricing rates used:', {
      voiceRate: voice_usage,
      didRate: DID_rate,
      tollFreeRate: toll_free_rate,
      chatRate: chatUsageRate,
      smsRate: smsUsageRate,
      appleMessagesRate: appleMessagesRate,
      whatsappRate: whatsappMessagingRate,
      chatExperiencesRate: chatExperiencesRate,
      emailRate: emailUsageRate,
      azqChatRate: azqChatRate,
      azqVoiceRate: azqVoiceRate,
      caseRate: caseUsageRate,
      cpDailyAzqRate: cpDailyAzqRate,
      cpDailyExtRate: cpDailyExtRate,
      guidesMessageRate: guidesMessageRate,
      taskUsageRate: taskUsageRate
    });

    let cost_voice_usage = 0, cost_did = 0, cost_toll_free = 0, cost_in_app_web_audio = 0, cost_screen_sharing = 0, cost_video_connection = 0, monthly_calls = 0, call_minutes = 0;

    // Only calculate voice/video metrics for voice/video service
    const isVoiceOrSpecialService = !isServiceType(serviceIdToUse, ServiceTypes.MESSAGING_CHAT) && 
                                   !isServiceType(serviceIdToUse, ServiceTypes.EMAIL) && 
                                   !isServiceType(serviceIdToUse, ServiceTypes.AMAZON_Q) && 
                                   !isServiceType(serviceIdToUse, ServiceTypes.CASE) && 
                                   !isServiceType(serviceIdToUse, ServiceTypes.CUSTOMER_PROFILE) &&
                                   !isServiceType(serviceIdToUse, ServiceTypes.GUIDES);
                                      
    if (isVoiceOrSpecialService) {
      // Fetch country details
      const country = await CountryModel.getCountryById(countryIdToUse);
      if (!country) {
        return res.status(404).json({ error: 'Country not found' });
      }

      // Fetch call type details
      const callType = await CallTypeModel.getCallTypeById(callTypeIdToUse);
      if (!callType) {
        return res.status(404).json({ error: 'Call type not found' });
      }

      // Compute Monthly Calls & Call Minutes
      monthly_calls = dailyUsageToUse * businessDaysToUse;
      call_minutes = monthly_calls * ahtToUse;

      // Compute Individual Costs using database rates
      cost_voice_usage = call_minutes * voice_usage;
      cost_did = DID_rate ? call_minutes * DID_rate : 0;
      cost_toll_free = toll_free_rate ? call_minutes * toll_free_rate : 0;
      cost_in_app_web_audio = in_app_web_audio ? call_minutes * in_app_web_audio : 0;
      cost_screen_sharing = screen_sharing ? call_minutes * screen_sharing : 0;
      cost_video_connection = video_connection ? call_minutes * video_connection : 0;
    }

    // Compute Individual Costs for Messaging and Chat using database rates
    const cost_chat_usage = chatUsageToUse && chatUsageRate ? chatUsageToUse * chatUsageRate : 0;
    const cost_sms_usage = smsUsageToUse && smsUsageRate ? smsUsageToUse * smsUsageRate : 0;
    const cost_apple_messages = appleMessagesToUse && appleMessagesRate ? appleMessagesToUse * appleMessagesRate : 0;
    const cost_whatsapp_messaging = whatsappMessagingToUse && whatsappMessagingRate ? whatsappMessagingToUse * whatsappMessagingRate : 0;
    const cost_chat_experiences = chatExperiencesToUse && chatExperiencesRate ? chatExperiencesToUse * chatExperiencesRate : 0;

    // Compute Individual Costs for Email using database rates
    const cost_email_usage = emailUsageToUse && emailUsageRate ? emailUsageToUse * emailUsageRate : 0;

    // Compute Amazon Q costs using database rates
    const cost_azq_chat_usage = chatAzqUsageToUse && azqChatRate ? chatAzqUsageToUse * azqChatRate : 0;
    const cost_azq_voice_usage = voiceAzqUsageToUse && azqVoiceRate ? voiceAzqUsageToUse * azqVoiceRate : 0;

    // Calculate case costs using database rates
    const cost_case_usage = caseUsageToUse && caseUsageRate ? caseUsageToUse * caseUsageRate : 0;

    // Add this with your other cost calculations
    // Calculate Task costs
    const cost_task_usage = taskUsageToUse && pricing.task_usage ? taskUsageToUse * pricing.task_usage : 0;

    // Calculate Customer Profile costs with additional charges
    const baseCostAzq = cp_daily_azq ? cp_daily_azq * pricing.cp_daily_azq_base : 0;
    const baseCostExt = cp_daily_ext ? cp_daily_ext * pricing.cp_daily_ext_base : 0;
    
    const additionalCostAzq = CalculationModel.calculateAdditionalCost(
      cp_daily_azq, 
      pricing.cp_daily_azq_base, 
      pricing.cp_additional_rate
    );
    
    const additionalCostExt = CalculationModel.calculateAdditionalCost(
      cp_daily_ext, 
      pricing.cp_daily_ext_base, 
      pricing.cp_additional_rate
    );

    const cost_cp_daily_azq = baseCostAzq + additionalCostAzq;
    const cost_cp_daily_ext = baseCostExt + additionalCostExt;

    // Add detailed logging for Customer Profile calculations
    console.log('Customer Profile input values:', {
      cpDailyAzqToUse, 
      cpDailyExtToUse
    });

    console.log('Customer Profile rates from database:', {
      cpDailyAzqRate, 
      cpDailyExtRate
    });

    // Log the messaging calculations for debugging
    console.log('Messaging calculation:', {
      chatUsage: chatUsageToUse,
      chatRate: pricing.chat_usage,
      chatCost: cost_chat_usage,
      smsUsage: smsUsageToUse,
      smsRate: pricing.sms_usage,
      smsCost: cost_sms_usage,
      appleMessages: appleMessagesToUse,
      appleRate: pricing.apple_messages,
      appleCost: cost_apple_messages,
      whatsapp: whatsappMessagingToUse,
      whatsappRate: pricing.whatsapp_messaging,
      whatsappCost: cost_whatsapp_messaging,
      chatExperiences: chatExperiencesToUse,
      chatExpRate: pricing.chat_experiences,
      chatExpCost: cost_chat_experiences
    });

    // Log the calculations for debugging
    console.log('Amazon Q calculation:', {
      chatUsage: chatAzqUsageToUse,
      chatRate: azqChatRate,
      chatCost: cost_azq_chat_usage,
      voiceUsage: voiceAzqUsageToUse,
      voiceRate: azqVoiceRate,
      voiceCost: cost_azq_voice_usage
    });

    // Log the case calculations for debugging
    console.log('Case calculation:', {
      caseUsage: caseUsageToUse,
      caseRate: caseUsageRate,
      caseCost: cost_case_usage
    });

    // Log the customer profile calculations for debugging
    console.log('Customer Profile calculation with raw values:', {
      cpDailyAzqToUse, 
      cpDailyAzqRate, 
      cost_cp_daily_azq,
      cpDailyExtToUse, 
      cpDailyExtRate, 
      cost_cp_daily_ext
    });

    // Add logging for email calculation
    console.log('Email calculation:', {
      emailUsage: emailUsageToUse,
      emailRate: emailUsageRate,
      emailCost: cost_email_usage
    });

    // Calculate Guides costs with better error handling
    let cost_msg_sent = 0;
    if (isServiceType(serviceIdToUse, ServiceTypes.GUIDES)) {
      if (msgSentToUse && guidesMessageRate) {
        cost_msg_sent = msgSentToUse * guidesMessageRate;
      } else if (msgSentToUse && !guidesMessageRate) {
        console.warn('Missing guides_message_rate in pricing data, calculation will be 0');
        // No fallback rate, keep cost as 0 to indicate missing data
      }
    }
    
    console.log('Detailed Guides calculation:', {
      msgSent: msgSentToUse,
      rate: guidesMessageRate,
      rawRate: pricing.guides_message_rate,
      calculation: guidesMessageRate ? `${msgSentToUse} * ${guidesMessageRate} = ${cost_msg_sent}` : 'Rate unavailable',
      cost: cost_msg_sent
    });

    // Add task usage logging with other usage logs
    console.log('Task calculation:', {
      taskUsage: taskUsageToUse,
      taskRate: taskUsageRate,
      taskCost: cost_task_usage
    });

    // Add to your detailed logging section
    console.log('Detailed Task calculation:', {
      usage: taskUsageToUse,
      rate: taskUsageRate,
      calculation: taskUsageRate ? `${taskUsageToUse} * ${taskUsageRate} = ${cost_task_usage}` : 'Rate unavailable',
      cost: cost_task_usage
    });

    // First, add debug logging before the total cost calculation
    console.log('Cost components before total calculation:', {
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
      cost_task_usage
    });

    // Then modify the total cost calculation to ensure we're handling undefined/null values
    const total_cost = parseFloat((
      (cost_voice_usage || 0) +
      (cost_did || 0) +
      (cost_toll_free || 0) +
      (cost_in_app_web_audio || 0) +
      (cost_screen_sharing || 0) +
      (cost_video_connection || 0) +
      (cost_chat_usage || 0) +
      (cost_sms_usage || 0) +
      (cost_apple_messages || 0) +
      (cost_whatsapp_messaging || 0) +
      (cost_chat_experiences || 0) +
      (cost_email_usage || 0) +
      (cost_azq_chat_usage || 0) +
      (cost_azq_voice_usage || 0) +
      (cost_case_usage || 0) +
      (cost_cp_daily_azq || 0) +
      (cost_cp_daily_ext || 0) +
      (cost_msg_sent || 0) +
      (cost_task_usage || 0)  // Add this line
    ).toFixed(2));

    // Log calculation result
    console.log('Total cost calculation result:', {
      total_cost,
      isNumber: !isNaN(total_cost),
      type: typeof total_cost
    });

    // Update response with calculated values
    response.total_cost = total_cost > 0 ? total_cost : 0;
    response.daily_usage = dailyUsageToUse;
    response.business_days = businessDaysToUse;
    response.aht = ahtToUse;

    // Add debug logging after the calculation
    console.log('Total cost calculation result:', {
      total_cost,
      isNumber: !isNaN(total_cost),
      type: typeof total_cost
    });

    // When setting the response, ensure we're using the calculated total
    response.total_cost = total_cost > 0 ? total_cost : 0;

    // Add final debug log
    console.log('Final response total_cost:', response.total_cost);

    console.log('Guides calculation:', {
      msgSent: msgSentToUse,
      rate: guidesMessageRate,
      cost: cost_msg_sent
    });

    // Save Calculation Results
    await CalculationModel.saveCalculationResult({
      calculation_logic_id: pricing.id,
      calculation_logic_mc_id: isServiceType(serviceIdToUse, ServiceTypes.MESSAGING_CHAT) ? pricing.id : null,
      calculation_logic_em_id: isServiceType(serviceIdToUse, ServiceTypes.EMAIL) ? pricing.id : null,
      calculation_logic_azq_id: isServiceType(serviceIdToUse, ServiceTypes.AMAZON_Q) ? pricing.id : null,  // Fixed typo AMAON_Q to AMAZON_Q
      calculation_logic_cs_id: isServiceType(serviceIdToUse, ServiceTypes.CASE) ? pricing.id : null,
      calculation_logic_cp_id: isServiceType(serviceIdToUse, ServiceTypes.CUSTOMER_PROFILE) ? pricing.id : null,
      calculation_logic_gd_id: isServiceType(serviceIdToUse, ServiceTypes.GUIDES) ? pricing.id : null,
      calculation_logic_tk_id: isServiceType(serviceIdToUse, ServiceTypes.TASK) ? pricing.id : null,
      calculation_logic_cl_id: isServiceType(serviceIdToUse, ServiceTypes.CONTACT_LENS) ? pricing.id : null,
      calculation_logic_fs_id: isServiceType(serviceIdToUse, ServiceTypes.FORECASTING_SCHEDULING) ? pricing.id : null,
      daily_usage: dailyUsageToUse, business_days: businessDaysToUse, aht: ahtToUse,
      chat_usage: chatUsageToUse, sms_usage: smsUsageToUse, apple_messages: appleMessagesToUse, whatsapp_messaging: whatsappMessagingToUse, chat_experiences: chatExperiencesToUse, email_usage: emailUsageToUse,
      chat_usage: chatUsageToUse, sms_usage: smsUsageToUse, apple_messages: appleMessagesToUse, whatsapp_messaging: whatsappMessagingToUse, chat_experiences: chatExperiencesToUse, email_usage: emailUsageToUse,
      chat_azq_usage: chatAzqUsageToUse, 
      voice_azq_usage: voiceAzqUsageToUse,
      case_usage: caseUsageToUse,
      cp_daily_azq: cpDailyAzqToUse,
      cp_daily_ext: cpDailyExtToUse,
      msg_sent: msgSentToUse,
      monthly_calls, call_minutes,
      cost_voice_usage, cost_did, cost_toll_free, 
      cost_in_app_web_audio, cost_screen_sharing, 
      cost_video_connection, total_cost, cost_chat_usage, cost_sms_usage, cost_apple_messages, cost_whatsapp_messaging, cost_chat_experiences, cost_email_usage, cost_azq_chat_usage, cost_azq_voice_usage, cost_case_usage, cost_cp_daily_azq, cost_cp_daily_ext, cost_msg_sent, cost_task_usage
    });

    // Return response with calculated costs
    // Add service name and country name to the response for UI display
    try {
      // Fetch country details with better error handling
      const country = await CountryModel.getCountryById(countryIdToUse);
      console.log('Country lookup with ID:', countryIdToUse, 'Result:', country);
      
      if (!country) {
        console.warn(`No country found with ID: ${countryIdToUse}`);
      }
      
      // Fetch service details
      const service = await ServiceModel.getServiceById(serviceIdToUse);
      console.log('Service lookup with ID:', serviceIdToUse, 'Result:', service);
      
      if (!service) {
        console.warn(`No service found with ID: ${serviceIdToUse}`);
      }
      
      // Add the data to the response if available
      response.countryCode = country ? country.country_code : 'N/A';
      response.countryName = country ? country.country_name : null;
      response.serviceName = service ? service.service_name : null;
      response.call_type_id = callTypeIdToUse;
      response.serviceId = serviceIdToUse; // Add this to help with frontend service identification
      
      // Set response properties based on service type
      if (isVoiceOrSpecialService) {
        response.monthly_calls = monthly_calls;
        response.call_minutes = call_minutes;
        response.cost_voice_usage = cost_voice_usage;
        response.cost_did = cost_did;
        response.cost_toll_free = cost_toll_free;
        response.cost_in_app_web_audio = cost_in_app_web_audio;
        response.cost_screen_sharing = cost_screen_sharing;
        response.cost_video_connection = cost_video_connection;
      } else if (isServiceType(serviceIdToUse, ServiceTypes.MESSAGING_CHAT)) {
        response.cost_chat_usage = cost_chat_usage;
        response.cost_sms_usage = cost_sms_usage;
        response.cost_apple_messages = cost_apple_messages;
        response.cost_whatsapp_messaging = cost_whatsapp_messaging;
        response.cost_chat_experiences = cost_chat_experiences;
      } else if (isServiceType(serviceIdToUse, ServiceTypes.EMAIL)) {
        response.cost_email_usage = cost_email_usage;
        response.serviceName = service ? service.service_name : "Email Service";
      } else if (isServiceType(serviceIdToUse, ServiceTypes.AMAZON_Q)) {
        response.cost_azq_chat_usage = cost_azq_chat_usage;
        response.cost_azq_voice_usage = cost_azq_voice_usage;
      } else if (isServiceType(serviceIdToUse, ServiceTypes.CASE)) {
        response.cost_case_usage = cost_case_usage;
        response.serviceName = service ? service.service_name : "Case Service";
      } else if (isServiceType(serviceIdToUse, ServiceTypes.CUSTOMER_PROFILE)) {
        // Log more debugging information
        console.log('CUSTOMER PROFILE DETECTED! Setting response values...');
        
        // Get base rates from pricing data for response
        const azqBaseRate = Number(pricing.cp_daily_azq_base || pricing.cp_daily_azq || 0);
        const extBaseRate = Number(pricing.cp_daily_ext_base || pricing.cp_daily_ext || 0);
        const additionalRate = Number(pricing.cp_additional_rate || 0);
        
        // Set response values directly from database values with proper formatting
        response.cp_daily_azq = cpDailyAzqToUse;
        response.cp_daily_ext = cpDailyExtToUse;
        response.cp_daily_azq_rate = azqBaseRate;
        response.cp_daily_ext_rate = extBaseRate;
        response.cp_additional_rate = additionalRate;
        response.cost_cp_daily_azq = parseFloat(cost_cp_daily_azq.toFixed(2));
        response.cost_cp_daily_ext = parseFloat(cost_cp_daily_ext.toFixed(2));
        response.serviceName = service ? service.service_name : "Customer Profile";
        response.total_cost = parseFloat((cost_cp_daily_azq + cost_cp_daily_ext).toFixed(2));
        
        // Debug info with pricing details
        response.debug = {
          serviceId: serviceIdToUse,
          isCustomerProfile: true,
          rawPricing: pricing ? {
            cp_daily_azq: pricing.cp_daily_azq,
            cp_daily_azq_base: pricing.cp_daily_azq_base,
            cp_daily_ext: pricing.cp_daily_ext,
            cp_daily_ext_base: pricing.cp_daily_ext_base,
            cp_additional_rate: pricing.cp_additional_rate
          } : 'pricing not available',
          calculation: {
            azqFormula: `${cpDailyAzqToUse} * ${azqBaseRate} = ${cost_cp_daily_azq}`,
            extFormula: `${cpDailyExtToUse} * ${extBaseRate} = ${cost_cp_daily_ext}`,
            totalFormula: `${cost_cp_daily_azq} + ${cost_cp_daily_ext} = ${response.total_cost}`
          }
        };
        
        console.log('Final Customer Profile response:', {
          inputs: { cpDailyAzq: response.cp_daily_azq, cpDailyExt: response.cp_daily_ext },
          rates: { azqRate: response.cp_daily_azq_rate, extRate: response.cp_daily_ext_rate },
          costs: { azqCost: response.cost_cp_daily_azq, extCost: response.cost_cp_daily_ext, total: response.total_cost }
        });
      } else if (isServiceType(serviceIdToUse, ServiceTypes.TASK)) {
        response.cost_task_usage = cost_task_usage;
        response.serviceName = service ? service.service_name : "Task Service";
        response.task_usage = taskUsageToUse;
      }
      
      console.log('Final response:', response);
    } catch (error) {
      console.error('Error fetching country or service details:', error);
    }

    res.json(response);

  } catch (err) {
    console.error('Error in calculation controller:', err);
    res.status(500).json({ error: err.message });
  }
};

// Add these missing methods to fix the route handler errors
exports.getVoicePricing = async (req, res) => {
  try {
    const pricing = await CalculationModel.getAllVoicePricing();
    res.json(pricing);
  } catch (err) {
    console.error('Error retrieving voice pricing data:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getChatPricing = async (req, res) => {
  try {
    const pricing = await CalculationModel.getAllChatPricing();
    res.json(pricing);
  } catch (err) {
    console.error('Error retrieving chat pricing data:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getEmailPricing = async (req, res) => {
  try {
    const pricing = await CalculationModel.getAllEmailPricing();
    res.json(pricing);
  } catch (err) {
    console.error('Error retrieving email pricing data:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAmazonQPricing = async (req, res) => {
  try {
    const pricing = await CalculationModel.getAllAmazonQPricing();
    res.json(pricing);
  } catch (err) {
    console.error('Error retrieving Amazon Q pricing data:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getTaskPricing = async (req, res) => {
  try {
    const pricing = await CalculationModel.getAllTaskPricing();
    res.json(pricing);
  } catch (err) {
    console.error('Error retrieving task pricing data:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCasePricing = async (req, res) => {
  try {
    const pricing = await CalculationModel.getAllCasePricing();
    res.json(pricing);
  } catch (err) {
    console.error('Error retrieving case pricing data:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCustomerProfilePricing = async (req, res) => {
  try {
    const pricing = await CalculationModel.getAllCustomerProfilePricing();
    res.json(pricing);
  } catch (err) {
    console.error('Error retrieving customer profile pricing data:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getGuidesPricing = async (req, res) => {
  try {
    const pricing = await CalculationModel.getAllGuidesPricing();
    res.json(pricing);
  } catch (err) {
    console.error('Error retrieving guides pricing data:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getACSPricing = async (req, res) => {
  try {
    const pricing = await CalculationModel.getAllACSPricing();
    res.json(pricing);
  } catch (err) {
    console.error('Error retrieving ACS pricing data:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getContactLensPricing = async (req, res) => {
  try {
    const pricing = await CalculationModel.getAllContactLensPricing();
    res.json(pricing);
  } catch (error) {
    console.error('Error fetching contact lens pricing:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getForecastingPricing = async (req, res) => {
  try {
    const pricing = await CalculationModel.getAllForecastingPricing();
    res.json(pricing);
  } catch (error) {
    console.error('Error fetching forecasting pricing:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getCalculationResults = async (req, res) => {
  try {
    const results = await CalculationModel.getAllCalculationResults();
    res.json(results);
  } catch (err) {
    console.error('Error retrieving calculation results:', err);
    res.status(500).json({ error: err.message });
  }
};

// Create a new collection
exports.createCollection = async (req, res) => {
  try {
    const { collection_name } = req.body;
    if (!collection_name) {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    const collectionId = await CalculationModel.createCollection(collection_name);
    res.status(201).json({ 
      collection_id: collectionId,
      collection_name: collection_name 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add calculation to collection
exports.addToCollection = async (req, res) => {
  try {
    const { collection_id, calculation_id } = req.body;
    if (!collection_id || !calculation_id) {
      return res.status(400).json({ error: 'Collection ID and calculation ID are required' });
    }

    await CalculationModel.addToCollection(collection_id, calculation_id);
    res.status(200).json({ message: 'Calculation added to collection successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get calculations in a collection
exports.getCollectionCalculations = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const calculations = await CalculationModel.getCollectionCalculations(collectionId);
    res.json(calculations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all collections
exports.getAllCollections = async (req, res) => {
  try {
    const collections = await CalculationModel.getAllCollections();
    res.json(collections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { collection_name } = req.body;

    if (!collection_name) {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    // Check if collection exists first using correct table name
    const [existingCollection] = await db.query(
      'SELECT * FROM calculation_collections WHERE collection_id = ?',
      [id]
    );

    if (!existingCollection || existingCollection.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Update collection name using correct table name
    await db.query(
      'UPDATE calculation_collections SET collection_name = ? WHERE collection_id = ?',
      [collection_name, id]
    );

    res.json({
      id,
      collection_name,
      message: 'Collection name updated successfully'
    });
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if collection exists
    const [existingCollection] = await db.query(
      'SELECT * FROM calculation_collections WHERE collection_id = ?',
      [id]
    );

    if (!existingCollection || existingCollection.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Check if collection has calculations
    const [calculations] = await db.query(
      'SELECT * FROM collection_items WHERE collection_id = ?',
      [id]
    );

    if (calculations && calculations.length > 0) {
      return res.status(400).json({ 
        error: 'Please delete all calculations from the collection before deleting the collection',
        calculationsCount: calculations.length
      });
    }

    // If no calculations, proceed with deletion
    await db.query(
      'DELETE FROM calculation_collections WHERE collection_id = ?',
      [id]
    );

    res.json({ 
      message: 'Collection deleted successfully',
      collection_id: id
    });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// Add this method to the file

exports.getCalculationResultById = async (req, res) => {
  try {
    const id = req.params.id;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid calculation ID' });
    }
    
    const result = await CalculationModel.getCalculationResultById(parseInt(id));
    
    if (!result) {
      return res.status(404).json({ error: 'Calculation result not found' });
    }
    
    res.json(result);
  } catch (err) {
    console.error('Error retrieving calculation result by ID:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateCalculationResult = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    let newCosts = {}; // Move declaration to top

    // Get existing calculation result
    const existingResult = await CalculationModel.getCalculationResultById(id);
    if (!existingResult) {
      return res.status(404).json({ error: 'Calculation result not found' });
    }

    // Define allowed fields based on the service type
    let allowedFields = [];
    let pricing;
    let updateData = {};
    // Check which service logic ID exists to determine service type
    if (existingResult.calculation_logic_id) {
      // Voice/Video Service
      allowedFields = ['daily_usage', 'business_days', 'aht'];
      const [pricingData] = await db.query(
        'SELECT vv.* FROM calculation_logic_vv vv WHERE vv.id = ?',
        [existingResult.calculation_logic_id]
      );
      pricing = pricingData[0];
    
      // Filter updates based on allowed fields
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });
    
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update. Allowed fields are: ' + allowedFields.join(', ')
        });
      }
    
      // Voice/Video calculations
      const daily_usage = updateData.daily_usage ?? existingResult.daily_usage;
      const business_days = updateData.business_days ?? existingResult.business_days;
      const aht = updateData.aht ?? existingResult.aht;
    
      const monthly_calls = daily_usage * business_days;
      const call_minutes = monthly_calls * aht;
    
      newCosts = {
        daily_usage,
        business_days,
        aht,
        monthly_calls,
        call_minutes,
        cost_voice_usage: parseFloat((call_minutes * pricing.voice_usage).toFixed(4)),
        cost_did: parseFloat((call_minutes * pricing.DID_rate).toFixed(4)),
        cost_toll_free: parseFloat((call_minutes * pricing.toll_free_rate).toFixed(4)),
        cost_in_app_web_audio: parseFloat((call_minutes * pricing.in_app_web_audio).toFixed(4)),
        cost_screen_sharing: parseFloat((call_minutes * pricing.screen_sharing).toFixed(4)),
        cost_video_connection: parseFloat((call_minutes * pricing.video_connection).toFixed(4))
      };
    
      newCosts.total_cost = parseFloat((
        newCosts.cost_voice_usage +
        newCosts.cost_did +
        newCosts.cost_toll_free +
        newCosts.cost_in_app_web_audio +
        newCosts.cost_screen_sharing +
        newCosts.cost_video_connection
      ).toFixed(4));
    }else if (existingResult.calculation_logic_mc_id) {
      // Messaging/Chat Service
      allowedFields = ['chat_usage', 'sms_usage', 'apple_messages', 'whatsapp_messaging', 'chat_experiences'];
      const [pricingData] = await db.query(
        'SELECT mc.* FROM calculation_logic_mc mc WHERE mc.id = ?',
        [existingResult.calculation_logic_mc_id]
      );
      pricing = pricingData[0];

            // Filter updates based on allowed fields
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });
    
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update. Allowed fields are: ' + allowedFields.join(', ')
        });
      }

            // Messaging/Chat calculations
            const chat_usage = updateData.chat_usage ?? existingResult.chat_usage;
            const sms_usage = updateData.sms_usage ?? existingResult.sms_usage;
            const apple_messages = updateData.apple_messages ?? existingResult.apple_messages;
            const whatsapp_messaging = updateData.whatsapp_messaging ?? existingResult.whatsapp_messaging;
            const chat_experiences = updateData.chat_experiences ?? existingResult.chat_experiences;
      
            newCosts = {
              cost_chat_usage: parseFloat((chat_usage * pricing.chat_usage).toFixed(4)),
              cost_sms_usage: parseFloat((sms_usage * pricing.sms_usage).toFixed(4)),
              cost_apple_messages: parseFloat((apple_messages * pricing.apple_messages).toFixed(4)),
              cost_whatsapp_messaging: parseFloat((whatsapp_messaging * pricing.whatsapp_messaging).toFixed(4)),
              cost_chat_experiences: parseFloat((chat_experiences * pricing.chat_experiences).toFixed(4))
            };
      
            newCosts.total_cost = parseFloat(Object.values(newCosts)
              .reduce((sum, value) => sum + value, 0)
              .toFixed(4));
    } else if (existingResult.calculation_logic_em_id) {
      // Email Service
      allowedFields = ['email_usage'];
      const [pricingData] = await db.query(
        'SELECT em.* FROM calculation_logic_em em WHERE em.id = ?',
        [existingResult.calculation_logic_em_id]
      );
      pricing = pricingData[0];

          // Filter updates based on allowed fields
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update. Allowed fields are: ' + allowedFields.join(', ')
      });
    }

    const email_usage = updateData.email_usage ?? existingResult.email_usage;

    newCosts = {
      cost_email_usage: parseFloat((email_usage * pricing.email_usage).toFixed(4))
    };

    newCosts.total_cost = parseFloat(Object.values(newCosts)
      .reduce((sum, value) => sum + value, 0)
      .toFixed(4));
    } else if (existingResult.calculation_logic_azq_id) {
      // Amazon Q Service
      allowedFields = ['chat_azq_usage', 'voice_azq_usage'];
      const [pricingData] = await db.query(
        'SELECT azq.* FROM calculation_logic_azq azq WHERE azq.id = ?',
        [existingResult.calculation_logic_azq_id]
      );
      pricing = pricingData[0];

          // Filter updates based on allowed fields
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update. Allowed fields are: ' + allowedFields.join(', ')
      });
    }
    const chat_azq_usage = updateData.chat_azq_usage ?? existingResult.chat_azq_usage;
    const voice_azq_usage = updateData.voice_azq_usage ?? existingResult.voice_azq_usage;

    newCosts = {
      cost_azq_chat_usage: parseFloat((chat_azq_usage * pricing.chat_usage).toFixed(4)),
      cost_azq_voice_usage: parseFloat((voice_azq_usage * pricing.voice_usage).toFixed(4))
    };

    newCosts.total_cost = parseFloat(Object.values(newCosts)
      .reduce((sum, value) => sum + value, 0)
      .toFixed(4));

    } else if (existingResult.calculation_logic_cs_id) {
      // Case Service
      allowedFields = ['case_usage'];
      const [pricingData] = await db.query(
        'SELECT cs.* FROM calculation_logic_cs cs WHERE cs.id = ?',
        [existingResult.calculation_logic_cs_id]
      );
      pricing = pricingData[0];

          // Filter updates based on allowed fields
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update. Allowed fields are: ' + allowedFields.join(', ')
      });
    }
    const case_usage = updateData.case_usage ?? existingResult.case_usage;

    newCosts = {
      cost_case_usage: parseFloat((case_usage * pricing.case_usage).toFixed(4))
    };

    newCosts.total_cost = parseFloat(Object.values(newCosts)
      .reduce((sum, value) => sum + value, 0)
      .toFixed(4));

    } else if (existingResult.calculation_logic_tk_id) {
      // Task Service
      allowedFields = ['task_usage'];
      const [pricingData] = await db.query(
        'SELECT tk.* FROM calculation_logic_tk tk WHERE tk.id = ?',
        [existingResult.calculation_logic_tk_id]  // Fix: Changed from calculation_logic_cs_id to calculation_logic_tk_id
      );
      pricing = pricingData[0];
    
      // Filter updates based on allowed fields
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });
    
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update. Allowed fields are: ' + allowedFields.join(', ')
        });
      }
    
      // Task calculations
      const task_usage = updateData.task_usage ?? existingResult.task_usage;
    
      newCosts = {
        task_usage,
        cost_task_usage: parseFloat((task_usage * pricing.task_usage).toFixed(4))
      };
    
      newCosts.total_cost = parseFloat(newCosts.cost_task_usage.toFixed(4));
    } else if (existingResult.calculation_logic_cp_id) {
      // Customer Profile Service
      allowedFields = ['cp_daily_azq', 'cp_daily_ext'];
      const [pricingData] = await db.query(
        'SELECT cp.* FROM calculation_logic_cp cp WHERE cp.id = ?',
        [existingResult.calculation_logic_cp_id]
      );
      pricing = pricingData[0];
    
      // Filter updates based on allowed fields
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });
    
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update. Allowed fields are: ' + allowedFields.join(', ')
        });
      }
    
      // Customer Profile calculations with base and additional rates
      const cp_daily_azq = updateData.cp_daily_azq ?? existingResult.cp_daily_azq;
      const cp_daily_ext = updateData.cp_daily_ext ?? existingResult.cp_daily_ext;
    
      // Calculate costs for daily azq
      let cost_cp_daily_azq = cp_daily_azq * pricing.cp_daily_azq_base;
      if (cp_daily_azq > 100) {
        const additionalHundredsAzq = Math.floor(cp_daily_azq / 100);
        cost_cp_daily_azq += additionalHundredsAzq * pricing.cp_additional_rate;
      }
    
      // Calculate costs for daily ext
      let cost_cp_daily_ext = cp_daily_ext * pricing.cp_daily_ext_base;
      if (cp_daily_ext > 100) {
        const additionalHundredsExt = Math.floor(cp_daily_ext / 100);
        cost_cp_daily_ext += additionalHundredsExt * pricing.cp_additional_rate;
      }
    
      // Format costs to 4 decimal places
      newCosts = {
        cp_daily_azq,
        cp_daily_ext,
        cost_cp_daily_azq: parseFloat(cost_cp_daily_azq.toFixed(4)),
        cost_cp_daily_ext: parseFloat(cost_cp_daily_ext.toFixed(4))
      };
    
      newCosts.total_cost = parseFloat((newCosts.cost_cp_daily_azq + newCosts.cost_cp_daily_ext).toFixed(4));
    }else if (existingResult.calculation_logic_gd_id) {
      // Guides Service
      allowedFields = ['msg_sent'];
      const [pricingData] = await db.query(
        'SELECT gd.* FROM calculation_logic_gd gd WHERE gd.id = ?',
        [existingResult.calculation_logic_gd_id]
      );
      pricing = pricingData[0];
    
      // Filter updates based on allowed fields
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });
    
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update. Allowed fields are: ' + allowedFields.join(', ')
        });
      }
    
      // Guides calculations
      const msg_sent = updateData.msg_sent ?? existingResult.msg_sent;
    
      newCosts = {
        msg_sent,
        cost_msg_sent: parseFloat((msg_sent * pricing.msg_sent).toFixed(4))
      };
    
      newCosts.total_cost = parseFloat(newCosts.cost_msg_sent.toFixed(4));
    }else if (existingResult.calculation_logic_aza_id) {
      // Agent Assist Service
      allowedFields = ['agent_usage'];
      const [pricingData] = await db.query(
        'SELECT aza.* FROM calculation_logic_aza aza WHERE aza.id = ?',
        [existingResult.calculation_logic_aza_id]
      );
      pricing = pricingData[0];
    
      // Filter updates based on allowed fields
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });
    
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update. Allowed fields are: ' + allowedFields.join(', ')
        });
      }
    
      // Agent Assist calculations
      const agent_usage = updateData.agent_usage ?? existingResult.agent_usage;
    
      newCosts = {
        agent_usage,
        cost_agent_usage: parseFloat((agent_usage * pricing.agent_usage).toFixed(4))
      };
    
      newCosts.total_cost = parseFloat(newCosts.cost_agent_usage.toFixed(4));
    } else if (existingResult.calculation_logic_vid_id) {
      // Voice ID Service
      allowedFields = ['voiceid_usage'];
      const [pricingData] = await db.query(
        'SELECT vid.* FROM calculation_logic_vid vid WHERE vid.id = ?',
        [existingResult.calculation_logic_vid_id]
      );
      pricing = pricingData[0];
    
      if (!pricing) {
        return res.status(404).json({ error: 'Voice ID pricing data not found' });
      }
    
      // Filter updates based on allowed fields
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });
    
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update. Allowed fields are: ' + allowedFields.join(', ')
        });
      }
    
      // Voice ID calculations
      const voiceid_usage = updateData.voiceid_usage ?? existingResult.voiceid_usage;
    
      newCosts = {
        voiceid_usage,
        cost_voiceid_usage: parseFloat((voiceid_usage * pricing.voiceid_usage).toFixed(4)),
        total_cost: parseFloat((voiceid_usage * pricing.voiceid_usage).toFixed(4))
      };
    } else if (existingResult.calculation_logic_acs_id) {
      // Amazon Connect Services
      allowedFields = [
        'invoice_acs', 'outbound_acs', 'chat_usage_acs',
        'email_acs', 'task_acs', 'sms_acs', 'apple_acs',
        'whatsapp_acs', 'guide_acs', 'outcamp_acs'
      ];
      
      const [pricingData] = await db.query(
        'SELECT acs.* FROM calculation_logic_acs acs WHERE acs.id = ?',
        [existingResult.calculation_logic_acs_id]
      );
      pricing = pricingData[0];
    
      if (!pricing) {
        return res.status(404).json({ error: 'ACS pricing data not found' });
      }
    
      // Filter updates based on allowed fields
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });
    
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update. Allowed fields are: ' + allowedFields.join(', ')
        });
      }
    
      // ACS calculations with proper rate field names and null checks
      const invoice_acs = Number(updateData.invoice_acs ?? existingResult.invoice_acs) || 0;
      const outbound_acs = Number(updateData.outbound_acs ?? existingResult.outbound_acs) || 0;
      const chat_usage_acs = Number(updateData.chat_usage_acs ?? existingResult.chat_usage_acs) || 0;
      const email_acs = Number(updateData.email_acs ?? existingResult.email_acs) || 0;
      const task_acs = Number(updateData.task_acs ?? existingResult.task_acs) || 0;
      const sms_acs = Number(updateData.sms_acs ?? existingResult.sms_acs) || 0;
      const apple_acs = Number(updateData.apple_acs ?? existingResult.apple_acs) || 0;
      const whatsapp_acs = Number(updateData.whatsapp_acs ?? existingResult.whatsapp_acs) || 0;
      const guide_acs = Number(updateData.guide_acs ?? existingResult.guide_acs) || 0;
      const outcamp_acs = Number(updateData.outcamp_acs ?? existingResult.outcamp_acs) || 0;
    
      // Calculate costs with proper null checks
      const cost_invoice_acs = parseFloat((invoice_acs * (Number(pricing.invoice_acs) || 0)).toFixed(4));
      const cost_outbound_acs = parseFloat((outbound_acs * (Number(pricing.outbound_acs) || 0)).toFixed(4));
      const cost_chat_usage_acs = parseFloat((chat_usage_acs * (Number(pricing.chat_acs) || 0)).toFixed(4));
      const cost_email_acs = parseFloat((email_acs * (Number(pricing.email_acs) || 0)).toFixed(4));
      const cost_task_acs = parseFloat((task_acs * (Number(pricing.task_acs) || 0)).toFixed(4));
      const cost_sms_acs = parseFloat((sms_acs * (Number(pricing.sms_acs) || 0)).toFixed(4));
      const cost_apple_acs = parseFloat((apple_acs * (Number(pricing.apple_acs) || 0)).toFixed(4));
      const cost_whatsapp_acs = parseFloat((whatsapp_acs * (Number(pricing.whatsapp_acs) || 0)).toFixed(4));
      const cost_guide_acs = parseFloat((guide_acs * (Number(pricing.guide_acs) || 0)).toFixed(4));
      const cost_outcamp_acs = parseFloat((outcamp_acs * (Number(pricing.outcamp_acs) || 0)).toFixed(4));
    
      newCosts = {
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
        cost_invoice_acs,
        cost_outbound_acs,
        cost_chat_usage_acs,
        cost_email_acs,
        cost_task_acs,
        cost_sms_acs,
        cost_apple_acs,
        cost_whatsapp_acs,
        cost_guide_acs,
        cost_outcamp_acs
      };
    
      // Calculate total cost with proper null checking
      newCosts.total_cost = parseFloat((
        cost_invoice_acs +
        cost_outbound_acs +
        cost_chat_usage_acs +
        cost_email_acs +
        cost_task_acs +
        cost_sms_acs +
        cost_apple_acs +
        cost_whatsapp_acs +
        cost_guide_acs +
        cost_outcamp_acs
      ).toFixed(4));
    }else if (existingResult.calculation_logic_cl_id) {
      // Contact Lens Service
      allowedFields = [
        'cl_voice_calls', 'cl_chat_message', 'cl_performance_eval',
        'cl_screen_rec', 'cl_external_voice', 'cl_external_connector'
      ];
      
      const [pricingData] = await db.query(
        'SELECT cl.* FROM calculation_logic_cl cl WHERE cl.id = ?',
        [existingResult.calculation_logic_cl_id]
      );
      pricing = pricingData[0];
    
      if (!pricing) {
        return res.status(404).json({ error: 'Contact Lens pricing data not found' });
      }
    
      // Filter updates based on allowed fields
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });
    
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update. Allowed fields are: ' + allowedFields.join(', ')
        });
      }
    
      // Parse input values with null checks
      const cl_voice_calls = Number(updateData.cl_voice_calls ?? existingResult.cl_voice_calls) || 0;
      const cl_chat_message = Number(updateData.cl_chat_message ?? existingResult.cl_chat_message) || 0;
      const cl_performance_eval = Number(updateData.cl_performance_eval ?? existingResult.cl_performance_eval) || 0;
      const cl_screen_rec = Number(updateData.cl_screen_rec ?? existingResult.cl_screen_rec) || 0;
      const cl_external_voice = Number(updateData.cl_external_voice ?? existingResult.cl_external_voice) || 0;
      const cl_external_connector = Number(updateData.cl_external_connector ?? existingResult.cl_external_connector) || 0;
    
      // Calculate voice calls cost with tiered pricing
      let cost_cl_voice_calls = 0;
      if (cl_voice_calls <= 5000000) {
        cost_cl_voice_calls = cl_voice_calls * Number(pricing.cl_voice_calls_base);
      } else {
        cost_cl_voice_calls = (5000000 * Number(pricing.cl_voice_calls_base)) + 
                             ((cl_voice_calls - 5000000) * Number(pricing.cl_voice_calls_additional_rate));
      }
    
      // Calculate external voice cost with tiered pricing
      let cost_cl_external_voice = 0;
      if (cl_external_voice > 2000000) {
        cost_cl_external_voice = (cl_external_voice - 2000000) * Number(pricing.cl_external_voice_additional_rate);
      }
    
      // Calculate other costs
      const cost_cl_chat_message = parseFloat((cl_chat_message * Number(pricing.cl_chat_message_usage)).toFixed(4));
      const cost_cl_performance_eval = parseFloat((cl_performance_eval * Number(pricing.cl_performance_evaluation)).toFixed(4));
      const cost_cl_screen_rec = parseFloat((cl_screen_rec * Number(pricing.cl_screen_recording)).toFixed(4));
      const cost_cl_external_connector = parseFloat((cl_external_connector * Number(pricing.cl_external_voice_connector)).toFixed(4));
    
      newCosts = {
        cl_voice_calls,
        cl_chat_message,
        cl_performance_eval,
        cl_screen_rec,
        cl_external_voice,
        cl_external_connector,
        cost_cl_voice_calls: parseFloat(cost_cl_voice_calls.toFixed(4)),
        cost_cl_chat_message,
        cost_cl_performance_eval,
        cost_cl_screen_rec,
        cost_cl_external_voice: parseFloat(cost_cl_external_voice.toFixed(4)),
        cost_cl_external_connector
      };
    
      // Calculate total cost
      newCosts.total_cost = parseFloat((
        newCosts.cost_cl_voice_calls +
        newCosts.cost_cl_chat_message +
        newCosts.cost_cl_performance_eval +
        newCosts.cost_cl_screen_rec +
        newCosts.cost_cl_external_voice +
        newCosts.cost_cl_external_connector
      ).toFixed(4));
    }else if (existingResult.calculation_logic_fs_id) {
      // Forecasting & Scheduling Service
      allowedFields = ['agent_forecasted'];
      const [pricingData] = await db.query(
        'SELECT fs.* FROM calculation_logic_fs fs WHERE fs.id = ?',
        [existingResult.calculation_logic_fs_id]
      );
      pricing = pricingData[0];
    
      if (!pricing) {
        return res.status(404).json({ error: 'Forecasting & Scheduling pricing data not found' });
      }
    
      // Filter updates based on allowed fields
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });
    
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update. Allowed fields are: ' + allowedFields.join(', ')
        });
      }
    
      // Parse input values with null checks
      const agent_forecasted = Number(updateData.agent_forecasted ?? existingResult.agent_forecasted) || 0;
    
      // Calculate costs
      const cost_agent_forecasted = parseFloat((agent_forecasted * Number(pricing.agent_forecasted)).toFixed(4));
    
      newCosts = {
        agent_forecasted,
        cost_agent_forecasted
      };
    
      // Calculate total cost
      newCosts.total_cost = parseFloat(cost_agent_forecasted.toFixed(4));
    }


    // Update with new calculations
    const updatedResult = await CalculationModel.updateCalculationResult(id, {
      ...updateData,
      ...newCosts
    });

    res.json(updatedResult);

  } catch (error) {
    console.error('Error updating calculation result:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCalculationResult = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if calculation exists
    const existingResult = await CalculationModel.getCalculationResultById(id);
    if (!existingResult) {
      return res.status(404).json({ error: 'Calculation result not found' });
    }

    // Delete the calculation
    await CalculationModel.deleteCalculationResult(id);

    res.status(200).json({ message: 'Calculation result deleted successfully' });
  } catch (error) {
    console.error('Error deleting calculation result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.removeCalculationFromCollection = async (req, res) => {
  try {
    const { collectionId, calculationId } = req.params;
    
    if (!collectionId || isNaN(parseInt(collectionId))) {
      return res.status(400).json({ error: 'Invalid collection ID' });
    }
    
    if (!calculationId || isNaN(parseInt(calculationId))) {
      return res.status(400).json({ error: 'Invalid calculation ID' });
    }
    
    // Check if the collection exists
    const [existingCollection] = await db.query(
      'SELECT * FROM calculation_collections WHERE collection_id = ?',
      [collectionId]
    );
    
    if (!existingCollection || existingCollection.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    // Check if the calculation is in the collection
    const [collectionItem] = await db.query(
      'SELECT * FROM collection_items WHERE collection_id = ? AND calculation_id = ?',
      [collectionId, calculationId]
    );
    
    if (!collectionItem || collectionItem.length === 0) {
      return res.status(404).json({ error: 'Calculation not found in collection' });
    }
    
    // Remove calculation from collection (but don't delete the calculation itself)
    await db.query(
      'DELETE FROM collection_items WHERE collection_id = ? AND calculation_id = ?',
      [collectionId, calculationId]
    );
    
    res.status(200).json({
      message: `Calculation ${calculationId} removed from collection ${collectionId}`,
      calculationId,
      collectionId
    });
  } catch (error) {
    console.error('Error removing calculation from collection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};