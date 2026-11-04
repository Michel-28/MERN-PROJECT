const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { optionalProtect } = require('../middleware/auth');

router.use(optionalProtect);

router.get('/', tripController.getTrips);
router.post('/', tripController.createTrip);
router.get('/:id', tripController.getTripById);
router.patch('/:id', tripController.updateTrip);
router.delete('/:id', tripController.deleteTrip);

module.exports = router;
