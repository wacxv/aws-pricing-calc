const db = require('../config/db.config');

class ServiceModel {
  static async getAllServices() {
    const [rows] = await db.query('SELECT * FROM connect_service');
    return rows;
  }

  static async getServiceById(serviceId) {
    const [rows] = await db.query(
      'SELECT * FROM connect_service WHERE service_id = ?',
      [serviceId]
    );
    return rows[0];
  }
}

module.exports = ServiceModel;
