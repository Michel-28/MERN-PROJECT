const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');
const { protect, authorize } = require('../middleware/auth');

// Specific routes first (public)
router.get('/featured', destinationController.getFeaturedDestinations);

// Collection routes
router.get('/', destinationController.getAllDestinations);
router.post('/', protect, authorize('admin'), destinationController.createDestination);

// Dynamic routes
router.get('/:idOrSlug', destinationController.getDestinationByIdOrSlug);
router.patch('/:id', protect, authorize('admin'), destinationController.updateDestination);
router.delete('/:id', protect, authorize('admin'), destinationController.deleteDestination);

module.exports = router;
