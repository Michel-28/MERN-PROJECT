const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { protect, authorize } = require('../middleware/auth');

// Public listing
router.get('/', packageController.getAllPackages);
router.post('/', protect, authorize('admin'), packageController.createPackage);

router.get('/:idOrSlug/availability', packageController.getPackageAvailability);
router.get('/:idOrSlug', packageController.getPackageByIdOrSlug);
router.patch('/:id', protect, authorize('admin'), packageController.updatePackage);
router.delete('/:id', protect, authorize('admin'), packageController.deletePackage);

module.exports = router;
