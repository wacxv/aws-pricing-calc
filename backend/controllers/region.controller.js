const RegionModel = require('../models/region.model');

exports.getRegions = async (req, res) => {
  try {
    const regions = await RegionModel.getAllRegions();
    res.json(regions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
