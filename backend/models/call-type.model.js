const db = require('../config/db.config');

class CallTypeModel {
  static async getAllCallTypes() {
    const [rows] = await db.query('SELECT * FROM call_type');
    return rows;
  }

  static async getCallTypeById(callTypeId) {
    const [rows] = await db.query('SELECT call_type_name FROM call_type WHERE call_type_id = ?', [callTypeId]);
    return rows[0]; 
  }
}

module.exports = CallTypeModel;
