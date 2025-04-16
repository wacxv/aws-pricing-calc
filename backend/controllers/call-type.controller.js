const CallTypeModel = require('../models/call-type.model');

exports.getCallTypes = async (req, res) => {
  try {
    const callTypes = await CallTypeModel.getAllCallTypes();
    res.json(callTypes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
