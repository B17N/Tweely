const { scrapeTwitterData } = require('../services/twitterScraper');

/**
 * Controller for Twitter scraping operations
 */

/**
 * Scrape Twitter data based on request parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const scrapeTwitter = async (req, res, next) => {
  try {
    const options = req.body;
    
    // Validate required fields if necessary
    if (
      !options.startUrls && 
      !options.searchTerms && 
      !options.twitterHandles && 
      !options.conversationIds
    ) {
      return res.status(400).json({
        success: false,
        message: 'At least one of startUrls, searchTerms, twitterHandles, or conversationIds is required'
      });
    }
    
    // Call the service function to scrape Twitter data
    const result = await scrapeTwitterData(options);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scrapeTwitter
}; 