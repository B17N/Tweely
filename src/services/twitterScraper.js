const { ApifyClient } = require('apify-client');
require('dotenv').config();

/**
 * Scrape Twitter data using Apify's tweet-scraper
 * @param {Object} options - Configuration options for the scraper
 * @param {Array} [options.startUrls] - Twitter URLs to scrape
 * @param {Array} [options.searchTerms] - Search terms to look for
 * @param {Array} [options.twitterHandles] - Twitter handles to scrape
 * @param {Array} [options.conversationIds] - Conversation IDs to scrape
 * @param {Number} [options.maxItems=100] - Maximum number of items to scrape
 * @param {String} [options.sort="Latest"] - Sort order (Latest, Top, etc.)
 * @param {String} [options.tweetLanguage] - Filter by language
 * @param {String} [options.author] - Filter by author
 * @param {String} [options.start] - Start date (YYYY-MM-DD)
 * @param {String} [options.end] - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - The scraped data and dataset info
 */

async function scrapeTwitterData(options = {}) {
  try {
    console.log('Twitter scraper service called with options:', JSON.stringify(options, null, 2));
    
    // Check if API token is set
    if (!process.env.APIFY_API_TOKEN) {
      console.error('APIFY_API_TOKEN is not set in environment variables');
      return {
        success: false,
        error: 'API token not configured. Please set APIFY_API_TOKEN in your .env file.'
      };
    }
    
    // Initialize the ApifyClient with API token from environment variables
    const client = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });
    
    console.log('ApifyClient initialized with token');

    // Default options
    const defaultOptions = {
      maxItems: 100,
      sort: 'Latest',
    };

    // Merge default options with provided options
    const input = { ...defaultOptions, ...options };
    
    // Validate that at least one search parameter is provided
    if (!input.startUrls?.length && 
        !input.searchTerms?.length && 
        !input.twitterHandles?.length && 
        !input.conversationIds?.length) {
      console.error('No search parameters provided');
      return {
        success: false,
        error: 'At least one of startUrls, searchTerms, twitterHandles, or conversationIds must be provided'
      };
    }

    // Run the Actor and wait for it to finish
    console.log('Starting Twitter scraping job...');
    console.log('Calling Apify actor with input:', JSON.stringify(input, null, 2));
    
    const run = await client.actor("apidojo/tweet-scraper").call(input);
    console.log('Apify actor run completed with ID:', run.id);
    
    // Get dataset ID and URL for reference
    const datasetId = run.defaultDatasetId;
    const datasetUrl = `https://console.apify.com/storage/datasets/${datasetId}`;
    console.log('Dataset created with ID:', datasetId);
    console.log('Dataset URL:', datasetUrl);
    
    // Fetch items from the dataset
    console.log('Fetching items from dataset...');
    const { items } = await client.dataset(datasetId).listItems();
    console.log(`Retrieved ${items.length} items from dataset`);
    
    // Check if we got the "noResults" flag
    if (items.length === 1 && items[0].noResults === true) {
      console.log('The Apify actor returned a "noResults" flag');
      console.log('This could be due to Twitter API limitations or the search parameters used');
    }
    
    console.log(`Twitter scraping completed. Found ${items.length} items.`);
    
    return {
      success: true,
      datasetId,
      datasetUrl,
      itemCount: items.length,
      items,
      runId: run.id,
      runInfo: {
        status: run.status,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt
      }
    };
  } catch (error) {
    console.error('Error scraping Twitter data:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

module.exports = {
  scrapeTwitterData
}; 