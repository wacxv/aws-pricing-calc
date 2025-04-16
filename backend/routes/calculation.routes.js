const express = require('express');
const router = express.Router();
const calculationController = require('../controllers/calculation.controller');

router.post('/', calculationController.calculateCost);
router.get('/voice-pricing', calculationController.getVoicePricing);
router.get('/chat-pricing', calculationController.getChatPricing);
router.get('/email-pricing', calculationController.getEmailPricing);
router.get('/amazonq-pricing', calculationController.getAmazonQPricing);
router.get('/calculation-results', calculationController.getCalculationResults);
router.get('/calculation-results/:id', calculationController.getCalculationResultById); // New route
router.get('/task-pricing', calculationController.getTaskPricing);
router.get('/case-pricing', calculationController.getCasePricing);
router.get('/customer-profile-pricing', calculationController.getCustomerProfilePricing); // Add this new route
router.get('/guides-pricing', calculationController.getGuidesPricing); // Add this new route
router.get('/acs-pricing', calculationController.getACSPricing); // Add this new route
router.get('/contact-lens-pricing', calculationController.getContactLensPricing); // Add this line
router.get('/forecasting-pricing', calculationController.getForecastingPricing); // Add this line

// Collection management routes
router.post('/collections', calculationController.createCollection);
router.post('/collections/add', calculationController.addToCollection);
router.get('/collections/:collectionId', calculationController.getCollectionCalculations);
router.get('/collections', calculationController.getAllCollections);
router.patch('/collections/:id', calculationController.updateCollection);
router.delete('/collections/:id', calculationController.deleteCollection);
router.delete('/collections/:collectionId/calculation-results/:calculationId', calculationController.removeCalculationFromCollection);

//PATCH requests
router.patch('/calculation-results/:id', calculationController.updateCalculationResult);

//DELETE REQUEST
router.delete('/calculation-results/:id', calculationController.deleteCalculationResult);

module.exports = router;
