const ServiceModel = require('../models/service.model');

exports.getServices = async (req, res) => {
  try {
    const services = await ServiceModel.getAllServices();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
