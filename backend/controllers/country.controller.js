const CountryModel = require('../models/country.model');

exports.getCountriesByRegion = async (req, res) => {
  try {
    const { regionId } = req.params;
    const countries = await CountryModel.getCountriesByRegion(regionId);
    res.json(countries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
