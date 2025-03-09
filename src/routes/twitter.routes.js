const express = require('express');
const { scrapeTwitter } = require('../controllers/twitterController');

const router = express.Router();

/**
 * @route POST /api/twitter/scrape
 * @desc Scrape Twitter data using Apify
 * @access Public (consider adding authentication middleware)
 */
router.post('/scrape', scrapeTwitter);

module.exports = router; 