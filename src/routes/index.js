const express = require('express');
const router = express.Router();

// Import route modules
const twitterRoutes = require('./twitter.routes');

// Define routes
router.use('/twitter', twitterRoutes);

router.get('/', (req, res) => {
  res.json({ message: 'API is working' });
});

module.exports = router; 