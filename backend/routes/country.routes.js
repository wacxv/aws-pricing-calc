const express = require('express');
const router = express.Router();
const countryController = require('../controllers/country.controller');

router.get('/:regionId', countryController.getCountriesByRegion);

module.exports = router;
