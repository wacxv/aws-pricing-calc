-- 1️⃣ Create Database
DROP DATABASE IF EXISTS awscalcu;
CREATE DATABASE awscalcu;
USE awscalcu;

-- Region Table
CREATE TABLE region (
region_id INT AUTO_INCREMENT PRIMARY KEY,
region_name VARCHAR(255) NOT NULL,
region_code VARCHAR(50) NOT NULL UNIQUE
);

-- Country Table (References Region)
CREATE TABLE country (
country_id INT AUTO_INCREMENT PRIMARY KEY,
country_name VARCHAR(255) NOT NULL,
country_code VARCHAR(10) NOT NULL,
region_id INT NOT NULL,
FOREIGN KEY (region_id) REFERENCES region(region_id) ON DELETE CASCADE
);

-- Call Type Table
CREATE TABLE call_type (
call_type_id INT AUTO_INCREMENT PRIMARY KEY,
call_type_name VARCHAR(255) NOT NULL UNIQUE
);

-- Connect Service Table
CREATE TABLE connect_service (
service_id INT AUTO_INCREMENT PRIMARY KEY,
service_name VARCHAR(255) NOT NULL
);

-- Calculation Logic Table (Updated)
CREATE TABLE calculation_logic_vv (
id INT AUTO_INCREMENT PRIMARY KEY,
service_id INT NOT NULL,
country_id INT NOT NULL,
call_type_id INT NOT NULL,

-- Cost Parameters
voice_usage DECIMAL(10,4) NOT NULL DEFAULT 0.018,
DID_rate DECIMAL(10,4) DEFAULT NULL,  
toll_free_rate DECIMAL(10,4) DEFAULT NULL,
in_app_web_audio DECIMAL(10,4) DEFAULT NULL,
screen_sharing DECIMAL(10,4) DEFAULT NULL,  
video_connection DECIMAL(10,4) DEFAULT NULL,  

-- Foreign Keys
FOREIGN KEY (service_id) REFERENCES connect_service(service_id) ON DELETE CASCADE,
FOREIGN KEY (country_id) REFERENCES country(country_id) ON DELETE CASCADE,
FOREIGN KEY (call_type_id) REFERENCES call_type(call_type_id) ON DELETE CASCADE
);

CREATE TABLE calculation_logic_mc (
id INT AUTO_INCREMENT PRIMARY KEY,
service_id INT NOT NULL,
-- Cost Parameters
chat_usage DECIMAL(10,4) DEFAULT NULL,
sms_usage DECIMAL(10,4) DEFAULT NULL,
apple_messages DECIMAL(10,4) DEFAULT NULL,
whatsapp_messaging DECIMAL(10,4) DEFAULT NULL,
chat_experiences DECIMAL(10,4) DEFAULT NULL,

-- Foreign Keys
FOREIGN KEY (service_id) REFERENCES connect_service(service_id) ON DELETE CASCADE
);

CREATE TABLE calculation_logic_em (
id INT AUTO_INCREMENT PRIMARY KEY,
service_id INT NOT NULL,
email_usage DECIMAL(10,4) DEFAULT NULL,
FOREIGN KEY (service_id) REFERENCES connect_service(service_id) ON DELETE CASCADE
);

CREATE TABLE calculation_logic_tk (
id INT AUTO_INCREMENT PRIMARY KEY,
service_id INT NOT NULL,
task_usage DECIMAL(10,4) DEFAULT NULL,
FOREIGN KEY (service_id) REFERENCES connect_service(service_id) ON DELETE CASCADE
);

CREATE TABLE calculation_logic_azq (
id INT AUTO_INCREMENT PRIMARY KEY,
service_id INT NOT NULL,
chat_usage DECIMAL(10,4) DEFAULT NULL,
voice_usage DECIMAL(10,4) DEFAULT NULL,
FOREIGN KEY (service_id) REFERENCES connect_service(service_id) ON DELETE CASCADE
);

CREATE TABLE calculation_logic_cs (
id INT AUTO_INCREMENT PRIMARY KEY,
service_id INT NOT NULL,
case_usage DECIMAL(10,4) DEFAULT NULL,
FOREIGN KEY (service_id) REFERENCES connect_service(service_id) ON DELETE CASCADE
);

-- Create Guides Calculation Logic Table
CREATE TABLE calculation_logic_gd (
id INT AUTO_INCREMENT PRIMARY KEY,
service_id INT NOT NULL,
msg_sent DECIMAL(10,4) DEFAULT NULL,
FOREIGN KEY (service_id) REFERENCES connect_service(service_id) ON DELETE CASCADE
);

CREATE TABLE calculation_logic_aza (
id INT AUTO_INCREMENT PRIMARY KEY,
service_id INT NOT NULL,
agent_usage DECIMAL(10,4) DEFAULT NULL,
FOREIGN KEY (service_id) REFERENCES connect_service(service_id) ON DELETE CASCADE
);

CREATE TABLE calculation_logic_vid (
id INT AUTO_INCREMENT PRIMARY KEY,
service_id INT NOT NULL,
voiceid_usage DECIMAL(10,4) DEFAULT NULL,
FOREIGN KEY (service_id) REFERENCES connect_service(service_id) ON DELETE CASCADE
);

CREATE TABLE calculation_logic_cp (
id INT AUTO_INCREMENT PRIMARY KEY,
service_id INT NOT NULL,
cp_daily_azq_base DECIMAL(10,4) DEFAULT 0.000,
cp_daily_ext_base DECIMAL(10,4) DEFAULT 0.005,
cp_additional_rate DECIMAL(10,4) DEFAULT 0.005,
FOREIGN KEY (service_id) REFERENCES connect_service(service_id) ON DELETE CASCADE
);

CREATE TABLE calculation_logic_acs (
id INT AUTO_INCREMENT PRIMARY KEY,
service_id INT NOT NULL,
invoice_acs DECIMAL(10,4) DEFAULT NULL,
outbound_acs DECIMAL(10,4) DEFAULT NULL,
chat_usage_acs DECIMAL(10,4) DEFAULT NULL,
email_acs DECIMAL(10,4) DEFAULT NULL,
task_acs DECIMAL(10,4) DEFAULT NULL,
sms_acs DECIMAL(10,4) DEFAULT NULL,
apple_acs DECIMAL(10,4) DEFAULT NULL,
whatsapp_acs DECIMAL(10,4) DEFAULT NULL,
guide_acs DECIMAL(10,4) DEFAULT NULL,
outcamp_acs DECIMAL(10,4) DEFAULT NULL,
FOREIGN KEY (service_id) REFERENCES connect_service(service_id) ON DELETE CASCADE
);

CREATE TABLE calculation_logic_cl (
id INT AUTO_INCREMENT PRIMARY KEY,
service_id INT NOT NULL,
cl_voice_calls_base DECIMAL(10,4) DEFAULT NULL,
cl_voice_calls_additional_rate DECIMAL(10,4) DEFAULT NULL,
cl_chat_message_usage DECIMAL(10,4) DEFAULT NULL,
cl_performance_evaluation DECIMAL(10,4) DEFAULT NULL,
cl_screen_recording DECIMAL(10,4) DEFAULT NULL,
cl_external_voice_base DECIMAL(10,4) DEFAULT NULL,
cl_external_voice_additional_rate DECIMAL(10,4) DEFAULT NULL,
cl_external_voice_connector DECIMAL(10,4) DEFAULT NULL,
FOREIGN KEY (service_id) REFERENCES connect_service(service_id) ON DELETE CASCADE
);

CREATE TABLE calculation_logic_fs (
id INT AUTO_INCREMENT PRIMARY KEY,
service_id INT NOT NULL,
agent_forecasted DECIMAL(10,4) DEFAULT NULL,
FOREIGN KEY (service_id) REFERENCES connect_service(service_id) ON DELETE CASCADE
);

-- Calculation Results Table (Updated)
CREATE TABLE calculation_results (
id INT AUTO_INCREMENT PRIMARY KEY,
calculation_logic_id INT DEFAULT NULL,  
calculation_logic_mc_id INT DEFAULT NULL,  
calculation_logic_em_id INT DEFAULT NULL,  
calculation_logic_tk_id INT DEFAULT NULL,
calculation_logic_azq_id INT DEFAULT NULL,
calculation_logic_cs_id INT DEFAULT NULL,
calculation_logic_gd_id INT DEFAULT NULL,
calculation_logic_aza_id INT DEFAULT NULL,
calculation_logic_vid_id INT DEFAULT NULL,
calculation_logic_cp_id INT DEFAULT NULL,
calculation_logic_acs_id INT DEFAULT NULL,
calculation_logic_cl_id INT DEFAULT NULL, 
calculation_logic_fs_id INT DEFAULT NULL,

-- User Inputs
daily_usage INT DEFAULT NULL, -- Daily Usage
business_days INT DEFAULT NULL, -- Number of business days in a month
aht DECIMAL(10,2) DEFAULT NULL, -- Average Handling Time
chat_usage DECIMAL(10,4) DEFAULT NULL, -- logic_mc input
sms_usage DECIMAL(10,4) DEFAULT NULL, -- logic_mc input
apple_messages DECIMAL(10,4) DEFAULT NULL, -- logic_mc input
whatsapp_messaging DECIMAL(10,4) DEFAULT NULL, -- logic_mc input
chat_experiences DECIMAL(10,4) DEFAULT NULL, -- logic_mc input
email_usage INT DEFAULT NULL, -- logic_em input
task_usage INT DEFAULT NULL, -- logic_tk input
chat_azq_usage INT DEFAULT NULL, -- logic_azq input
voice_azq_usage INT DEFAULT NULL, -- logic_azq input
case_usage INT DEFAULT NULL, -- logic_cs input
msg_sent INT DEFAULT NULL, -- logic_gd input
agent_usage INT DEFAULT NULL, -- logic_aza input
voiceid_usage INT DEFAULT NULL, -- logic_vid input
cp_daily_azq INT DEFAULT NULL, -- logic_cp input
cp_daily_ext INT DEFAULT NULL,-- logic_cp input 2
invoice_acs INT DEFAULT NULL,
outbound_acs INT DEFAULT NULL,
chat_usage_acs INT DEFAULT NULL,
email_acs INT DEFAULT NULL,
task_acs INT DEFAULT NULL,
sms_acs INT DEFAULT NULL,
apple_acs INT DEFAULT NULL,
whatsapp_acs INT DEFAULT NULL,
guide_acs INT DEFAULT NULL,
outcamp_acs INT DEFAULT NULL,
cl_voice_calls INT DEFAULT NULL,
cl_chat_message INT DEFAULT NULL,
cl_performance_eval INT DEFAULT NULL,
cl_screen_rec INT DEFAULT NULL,
cl_external_voice INT DEFAULT NULL,
cl_external_connector INT DEFAULT NULL,  
agent_forecasted INT DEFAULT NULL,


-- Calculated Values (Updated by Trigger)
monthly_calls INT DEFAULT NULL,
call_minutes DECIMAL(10,2) DEFAULT NULL, 

-- Cost Breakdown (Names fixed for consistency)
cost_voice_usage DECIMAL(10,4) DEFAULT NULL, -- logic_vv output
cost_did DECIMAL(10,4) DEFAULT NULL, -- logic_vv output
cost_toll_free DECIMAL(10,4) DEFAULT NULL, -- logic_vv output
cost_in_app_web_audio DECIMAL(10,4) DEFAULT NULL, -- logic_vv output
cost_screen_sharing DECIMAL(10,4) DEFAULT NULL, -- logic_vv output
cost_video_connection DECIMAL(10,4) DEFAULT NULL, -- logic_vv output
cost_chat_usage DECIMAL(10,4) DEFAULT NULL, -- logic_mc output
cost_sms_usage DECIMAL(10,4) DEFAULT NULL, -- logic_mc output
cost_apple_messages DECIMAL(10,4) DEFAULT NULL, -- logic_mc output
cost_whatsapp_messaging DECIMAL(10,4) DEFAULT NULL, -- logic_mc output
cost_chat_experiences DECIMAL(10,4) DEFAULT NULL, -- logic_mc output
cost_email_usage DECIMAL(10,4) DEFAULT NULL, -- logic_em output
cost_task_usage DECIMAL(10,4) DEFAULT NULL, -- logic_tk output
cost_azq_chat_usage DECIMAL(10,4) DEFAULT NULL, -- logic_azq output
cost_azq_voice_usage DECIMAL(10,4) DEFAULT NULL, -- logic_azq output
cost_case_usage DECIMAL(10,4) DEFAULT NULL, -- logic_cs output
cost_msg_sent DECIMAL(10,4) DEFAULT NULL, -- logic_gd output
cost_agent_usage DECIMAL(10,4) DEFAULT NULL, -- logic_aza output
cost_voiceid_usage DECIMAL(10,4) DEFAULT NULL, -- logic_vid output
cost_cp_daily_azq DECIMAL(10,4) DEFAULT NULL, -- logic_cp output
cost_cp_daily_ext DECIMAL(10,4) DEFAULT NULL, -- logic_cp output 2
cost_invoice_acs DECIMAL(10,4) DEFAULT NULL,
cost_outbound_acs DECIMAL(10,4) DEFAULT NULL,
cost_chat_usage_acs DECIMAL(10,4) DEFAULT NULL,
cost_email_acs DECIMAL(10,4) DEFAULT NULL,
cost_task_acs DECIMAL(10,4) DEFAULT NULL,
cost_sms_acs DECIMAL(10,4) DEFAULT NULL,
cost_apple_acs DECIMAL(10,4) DEFAULT NULL,
cost_whatsapp_acs DECIMAL(10,4) DEFAULT NULL,
cost_guide_acs DECIMAL(10,4) DEFAULT NULL,
cost_outcamp_acs DECIMAL(10,4) DEFAULT NULL,
cost_cl_voice_calls DECIMAL(10,4) DEFAULT NULL,
cost_cl_chat_message DECIMAL(10,4) DEFAULT NULL,
cost_cl_performance_eval DECIMAL(10,4) DEFAULT NULL,
cost_cl_screen_rec DECIMAL(10,4) DEFAULT NULL,
cost_cl_external_voice DECIMAL(10,4) DEFAULT NULL,
cost_cl_external_connector DECIMAL(10,4) DEFAULT NULL,    
cost_agent_forecasted DECIMAL(10,4) DEFAULT NULL,
country_code VARCHAR(10) DEFAULT NULL,
country_name VARCHAR(255) DEFAULT NULL,
total_cost DECIMAL(10,4) DEFAULT NULL,

-- Foreign Keys
FOREIGN KEY (calculation_logic_id) REFERENCES calculation_logic_vv(id) ON DELETE CASCADE,
FOREIGN KEY (calculation_logic_mc_id) REFERENCES calculation_logic_mc(id) ON DELETE CASCADE,
FOREIGN KEY (calculation_logic_em_id) REFERENCES calculation_logic_em(id) ON DELETE CASCADE,
FOREIGN KEY (calculation_logic_tk_id) REFERENCES calculation_logic_tk(id) ON DELETE CASCADE,
FOREIGN KEY (calculation_logic_azq_id) REFERENCES calculation_logic_azq(id) ON DELETE CASCADE,
FOREIGN KEY (calculation_logic_cs_id) REFERENCES calculation_logic_cs(id) ON DELETE CASCADE,
FOREIGN KEY (calculation_logic_gd_id) REFERENCES calculation_logic_gd(id) ON DELETE CASCADE,
FOREIGN KEY (calculation_logic_aza_id) REFERENCES calculation_logic_aza(id) ON DELETE CASCADE,
FOREIGN KEY (calculation_logic_vid_id) REFERENCES calculation_logic_vid(id) ON DELETE CASCADE,
FOREIGN KEY (calculation_logic_cp_id) REFERENCES calculation_logic_cp(id) ON DELETE CASCADE,
FOREIGN KEY (calculation_logic_acs_id) REFERENCES calculation_logic_cp(id) ON DELETE CASCADE,
FOREIGN KEY (calculation_logic_cl_id) REFERENCES calculation_logic_cl(id) ON DELETE CASCADE,
FOREIGN KEY (calculation_logic_fs_id) REFERENCES calculation_logic_fs(id) ON DELETE CASCADE
);

-- First create the collections table
CREATE TABLE calculation_collections (
collection_id INT AUTO_INCREMENT PRIMARY KEY,
collection_name VARCHAR(255) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create junction table for collection items
CREATE TABLE collection_items (
collection_id INT NOT NULL,
calculation_id INT NOT NULL,
added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (collection_id, calculation_id),
FOREIGN KEY (collection_id) REFERENCES calculation_collections(collection_id) ON DELETE CASCADE,
FOREIGN KEY (calculation_id) REFERENCES calculation_results(id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 0;

-- Load Region Data
LOAD DATA INFILE 'D:/owjeytee/aws-pricing-calcu/backend/awscalcu-csv/region.csv'
INTO TABLE region
FIELDS TERMINATED BY ','  
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n';

-- Load Country Data
LOAD DATA INFILE 'D:/owjeytee/aws-pricing-calcu/backend/awscalcu-csv/country.csv'
INTO TABLE country
FIELDS TERMINATED BY ','  
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n';

-- Load Call Type Data
LOAD DATA INFILE 'D:/owjeytee/aws-pricing-calcu/backend/awscalcu-csv/call_type.csv'
INTO TABLE call_type
FIELDS TERMINATED BY ','  
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
(call_type_id, call_type_name);

-- Load Connect Service Data
LOAD DATA INFILE 'D:/owjeytee/aws-pricing-calcu/backend/awscalcu-csv/connect_service.csv'
INTO TABLE connect_service
FIELDS TERMINATED BY ','  
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n';

-- Load Calculation Logic VV Data
LOAD DATA INFILE 'D:/owjeytee/aws-pricing-calcu/backend/awscalcu-csv/calculation_logic_vv.csv'
INTO TABLE calculation_logic_vv
FIELDS TERMINATED BY ','  
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n';

-- Load Calculation Logic MC Data
LOAD DATA INFILE 'D:/owjeytee/aws-pricing-calcu/backend/awscalcu-csv/calculation_logic_mc.csv'
INTO TABLE calculation_logic_mc
FIELDS TERMINATED BY ','  
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n';

-- Load Calculation Logic EM Data
LOAD DATA INFILE 'D:/owjeytee/aws-pricing-calcu/backend/awscalcu-csv/calculation_logic_em.csv'
INTO TABLE calculation_logic_em
FIELDS TERMINATED BY ','  
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n';

-- Load Calculation Logic EM Data
LOAD DATA INFILE 'D:/owjeytee/aws-pricing-calcu/backend/awscalcu-csv/calculation_logic_tk.csv'
INTO TABLE calculation_logic_tk
FIELDS TERMINATED BY ','  
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n';

LOAD DATA INFILE 'D:/owjeytee/aws-pricing-calcu/backend/awscalcu-csv/calculation_logic_azq.csv'
INTO TABLE calculation_logic_azq
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(service_id, chat_usage, voice_usage);

LOAD DATA INFILE 'D:/owjeytee/aws-pricing-calcu/backend/awscalcu-csv/calculation_logic_cs.csv'
INTO TABLE calculation_logic_cs
FIELDS TERMINATED BY ','  
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(service_id, case_usage);

LOAD DATA INFILE 'D:/owjeytee/aws-pricing-calcu/backend/awscalcu-csv/calculation_logic_gd.csv'
INTO TABLE calculation_logic_gd
FIELDS TERMINATED BY ','  
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(service_id, msg_sent);

LOAD DATA INFILE 'D:/owjeytee/aws-pricing-calcu/backend/awscalcu-csv/calculation_logic_aza.csv'
INTO TABLE calculation_logic_aza
FIELDS TERMINATED BY ','  
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(service_id, agent_usage);

LOAD DATA INFILE 'D:/owjeytee/aws-pricing-calcu/backend/awscalcu-csv/calculation_logic_vid.csv'
INTO TABLE calculation_logic_vid
FIELDS TERMINATED BY ','  
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(service_id, voiceid_usage);

LOAD DATA INFILE 'D:/owjeytee/aws-pricing-calcu/backend/awscalcu-csv/calculation_logic_cp.csv'
INTO TABLE calculation_logic_cp
FIELDS TERMINATED BY ','  
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(service_id,cp_daily_azq_base,cp_daily_ext_base,cp_additional_rate);

LOAD DATA INFILE 'D:/owjeytee/aws-pricing-calcu/backend/awscalcu-csv/calculation_logic_acs.csv'
INTO TABLE calculation_logic_acs
FIELDS TERMINATED BY ','  
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(service_id, invoice_acs, outbound_acs, chat_usage_acs, email_acs, task_acs, sms_acs, apple_acs, whatsapp_acs, guide_acs, outcamp_acs);

LOAD DATA INFILE 'D:/owjeytee/aws-pricing-calcu/backend/awscalcu-csv/calculation_logic_cl.csv'
INTO TABLE calculation_logic_cl
FIELDS TERMINATED BY ','  
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(service_id,cl_voice_calls_base,cl_voice_calls_additional_rate,cl_chat_message_usage,cl_performance_evaluation,cl_screen_recording,cl_external_voice_base,cl_external_voice_additional_rate,cl_external_voice_connector);

LOAD DATA INFILE 'D:/owjeytee/aws-pricing-calcu/backend/awscalcu-csv/calculation_logic_fs.csv'
INTO TABLE calculation_logic_fs
FIELDS TERMINATED BY ','  
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(service_id,agent_forecasted);

SET FOREIGN_KEY_CHECKS = 1;

