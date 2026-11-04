const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { optionalProtect } = require('../middleware/auth');

router.use(optionalProtect);

router.get('/', favoriteController.getFavorites);
router.post('/', favoriteController.addFavorite);
router.delete('/:id', favoriteController.removeFavorite);
router.delete('/', favoriteController.removeFavorite);

module.exports = router;
