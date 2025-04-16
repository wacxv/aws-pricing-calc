const db = require('../config/db.config');

class RegionModel {
  static async getAllRegions() {
    const [rows] = await db.query('SELECT * FROM region');
    return rows;
  }
}

module.exports = RegionModel;
