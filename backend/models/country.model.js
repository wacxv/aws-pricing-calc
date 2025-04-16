const db = require('../config/db.config');

class CountryModel {
  static async getCountriesByRegion(regionId) {
    const [rows] = await db.query(
      'SELECT * FROM country WHERE region_id = ?',
      [regionId]
    );
    return rows;
  }

  static async getCountryById(countryId) {
    console.log('Looking up country with ID:', countryId);
    const [rows] = await db.query(
      'SELECT * FROM country WHERE country_id = ?',
      [countryId]
    );
    console.log('Found country:', rows[0]);
    return rows[0];
  }
}

module.exports = CountryModel;
