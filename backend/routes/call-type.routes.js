const express = require('express');
const router = express.Router();
const callTypeController = require('../controllers/call-type.controller');

router.get('/', callTypeController.getCallTypes);

module.exports = router;
